import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SunatService } from '../sunat/sunat.service';
import { CreateInvoiceDto, InvoiceTypeEnum } from './dto/create-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import {
  UblInvoiceData,
  SunatDocumentType,
  SunatIdentityDocType,
  InvoiceItem,
} from '../sunat/types/sunat.types';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../bullmq/bullmq.module';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sunatService: SunatService,
    @Optional()
    @Inject('BULLMQ_QUEUES')
    private readonly queues?: Record<string, Queue>,
  ) {}

  /**
   * Mapea el enum de Prisma/DTO a código de catálogo SUNAT (01, 03, 07, 08)
   */
  mapInvoiceTypeToSunat(type: InvoiceTypeEnum | string): SunatDocumentType {
    switch (type) {
      case InvoiceTypeEnum.FACTURA:
      case 'FACTURA':
        return '01';
      case InvoiceTypeEnum.BOLETA:
      case 'BOLETA':
        return '03';
      case InvoiceTypeEnum.NOTA_CREDITO:
      case 'NOTA_CREDITO':
        return '07';
      case InvoiceTypeEnum.NOTA_DEBITO:
      case 'NOTA_DEBITO':
        return '08';
      default:
        return '03';
    }
  }

  /**
   * Crea un nuevo comprobante electrónico en la base de datos
   * y opcionalmente lo procesa y envía a SUNAT de inmediato o mediante la cola BullMQ.
   */
  async create(createDto: CreateInvoiceDto, academyId: string) {
    // 1. Obtener o inicializar configuración de facturación del tenant
    let billingSetting = await this.prisma.billingSetting.findUnique({
      where: { academyId },
    });

    if (!billingSetting) {
      // Configuración predeterminada en modo BETA si no está creada aún
      billingSetting = await this.prisma.billingSetting.create({
        data: {
          academyId,
          solUser: process.env.SUNAT_SOL_USER || 'MODDATOS',
          solPassword: process.env.SUNAT_SOL_PASS || 'moddatos',
          ruc: process.env.SUNAT_RUC || '20000000001',
          environment: process.env.SUNAT_ENV || 'BETA',
          boletaSeries: 'B001',
          facturaSeries: 'F001',
          notaCreditoSeries: 'NC01',
          notaDebitoSeries: 'ND01',
        },
      });
    }

    // 2. Determinar la serie correspondiente
    let series = createDto.series;
    if (!series) {
      switch (createDto.invoiceType) {
        case InvoiceTypeEnum.FACTURA:
          series = billingSetting.facturaSeries || 'F001';
          break;
        case InvoiceTypeEnum.BOLETA:
          series = billingSetting.boletaSeries || 'B001';
          break;
        case InvoiceTypeEnum.NOTA_CREDITO:
          series = billingSetting.notaCreditoSeries || 'NC01';
          break;
        case InvoiceTypeEnum.NOTA_DEBITO:
          series = billingSetting.notaDebitoSeries || 'ND01';
          break;
      }
    }

    // 3. Obtener el siguiente correlativo secuencial para este tipo y serie dentro del tenant
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        academyId,
        invoiceType: createDto.invoiceType as any,
        series,
      },
      orderBy: { correlative: 'desc' },
      select: { correlative: true },
    });

    const nextCorrelative = (lastInvoice?.correlative || 0) + 1;

    // 4. Calcular importes a partir de los ítems
    let subtotalAcc = 0;
    let igvAcc = 0;
    let totalAcc = 0;

    const formattedItems: InvoiceItem[] = createDto.items.map((item, idx) => {
      const unitPriceWithIgv = Number(item.unitPrice);
      const quantity = Number(item.quantity);
      // Precio sin IGV = precio con IGV / 1.18
      const unitPriceWithoutIgv = +(unitPriceWithIgv / 1.18).toFixed(2);
      const lineSubtotal = +(unitPriceWithoutIgv * quantity).toFixed(2);
      const lineTotal = +(unitPriceWithIgv * quantity).toFixed(2);
      const lineIgv = +(lineTotal - lineSubtotal).toFixed(2);

      subtotalAcc += lineSubtotal;
      igvAcc += lineIgv;
      totalAcc += lineTotal;

      return {
        id: idx + 1,
        description: item.description,
        unitCode: item.unitCode || 'ZZ',
        quantity,
        unitPrice: unitPriceWithIgv,
        unitPriceWithoutIgv,
        subtotal: lineSubtotal,
        igv: lineIgv,
        total: lineTotal,
      };
    });

    subtotalAcc = +subtotalAcc.toFixed(2);
    igvAcc = +igvAcc.toFixed(2);
    totalAcc = +totalAcc.toFixed(2);

    // 5. Crear el registro en Prisma
    const invoice = await this.prisma.invoice.create({
      data: {
        academyId,
        paymentId: createDto.paymentId || null,
        invoiceType: createDto.invoiceType as any,
        series,
        correlative: nextCorrelative,
        clientDocType: createDto.clientDocType,
        clientDocNum: createDto.clientDocNum,
        clientName: createDto.clientName,
        clientAddress: createDto.clientAddress || null,
        subtotal: new Decimal(subtotalAcc),
        igv: new Decimal(igvAcc),
        total: new Decimal(totalAcc),
        items: formattedItems as any,
        referenceSeries: createDto.referenceSeries || null,
        referenceCorrelative: createDto.referenceCorrelative || null,
        referenceCode: createDto.referenceCode || null,
        referenceReason: createDto.referenceReason || null,
        status: 'PENDING',
        attempts: 0,
      },
    });

    // 6. Enviar a SUNAT (inmediato o encolado)
    if (createDto.sendImmediately !== false) {
      try {
        return await this.dispatchInvoiceToSunat(invoice.id);
      } catch (err: any) {
        this.logger.error(
          `Error en envío inmediato a SUNAT para invoice ${invoice.id}: ${err.message}`,
        );
        return await this.prisma.invoice.findUnique({ where: { id: invoice.id } });
      }
    } else {
      // Encolar en BullMQ si la cola está disponible
      if (this.queues?.[QUEUE_NAMES.BILLING]) {
        await this.queues[QUEUE_NAMES.BILLING].add('process_invoice', {
          invoiceId: invoice.id,
          academyId,
        });
        this.logger.log(`Invoice ${invoice.id} encolado en BullMQ [billing]`);
      }
      return invoice;
    }
  }

  /**
   * Ejecuta el envío real hacia SUNAT para un comprobante existente
   */
  async dispatchInvoiceToSunat(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { academy: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Comprobante con ID ${invoiceId} no encontrado`);
    }

    const billingSetting = await this.prisma.billingSetting.findUnique({
      where: { academyId: invoice.academyId },
    });

    // Actualizar estado a PROCESSING
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PROCESSING',
        attempts: { increment: 1 },
      },
    });

    // Preparar estructura UBL
    const sunatDocType = this.mapInvoiceTypeToSunat(invoice.invoiceType);
    const issueDate = invoice.issuedAt.toISOString().slice(0, 10);
    const issueTime = invoice.issuedAt.toTimeString().slice(0, 8);

    const items: InvoiceItem[] = Array.isArray(invoice.items)
      ? (invoice.items as any)
      : [
          {
            id: 1,
            description: `Concepto de ${invoice.invoiceType}`,
            unitCode: 'ZZ',
            quantity: 1,
            unitPrice: Number(invoice.total),
            unitPriceWithoutIgv: Number(invoice.subtotal),
            subtotal: Number(invoice.subtotal),
            igv: Number(invoice.igv),
            total: Number(invoice.total),
          },
        ];

    const rucEmisor =
      billingSetting?.ruc ||
      invoice.academy?.ruc ||
      process.env.SUNAT_RUC ||
      '20000000001';

    const legalNameEmisor =
      invoice.academy?.name || 'ACADEMIA DEPORTIVA DEMO S.A.C.';

    const ublData: UblInvoiceData = {
      documentType: sunatDocType,
      series: invoice.series,
      correlative: invoice.correlative,
      issueDate,
      issueTime,
      currency: 'PEN',
      company: {
        ruc: rucEmisor,
        legalName: legalNameEmisor,
        commercialName: invoice.academy?.name,
        address: invoice.academy?.address || 'CALLE DEPORTIVA 100',
        district: 'MIRAFLORES',
        province: 'LIMA',
        department: 'LIMA',
      },
      client: {
        docType: (invoice.clientDocType as SunatIdentityDocType) || '1',
        docNumber: invoice.clientDocNum,
        name: invoice.clientName,
        address: invoice.clientAddress || undefined,
      },
      items,
      subtotal: Number(invoice.subtotal),
      igv: Number(invoice.igv),
      total: Number(invoice.total),
    };

    // Agregar discrepancia si es Nota de Crédito o Débito
    if (
      (sunatDocType === '07' || sunatDocType === '08') &&
      invoice.referenceSeries &&
      invoice.referenceCorrelative
    ) {
      const paddedRefCorrelative = invoice.referenceCorrelative.toString().padStart(8, '0');
      const refId = `${invoice.referenceSeries}-${paddedRefCorrelative}`;
      ublData.discrepancyResponse = {
        referenceId: refId,
        responseCode: invoice.referenceCode || '01',
        description: invoice.referenceReason || 'Anulación de la operación',
      };
      ublData.billingReference = {
        documentId: refId,
        documentTypeCode: invoice.referenceSeries.startsWith('F') ? '01' : '03',
      };
    }

    // Configurar opciones de SUNAT
    const env = (billingSetting?.environment?.toUpperCase() as any) || 'BETA';
    const fullUsername = billingSetting?.solUser
      ? billingSetting.solUser.startsWith(rucEmisor)
        ? billingSetting.solUser
        : `${rucEmisor}${billingSetting.solUser}`
      : undefined;

    const credentials = billingSetting
      ? {
          username: fullUsername,
          password: billingSetting.solPassword,
        }
      : undefined;

    const signerCredentials = {
      certificatePem: billingSetting?.certificatePem || undefined,
      certificatePassword: billingSetting?.certificatePass || undefined,
    };

    // Procesar y enviar
    const result = await this.sunatService.processAndSendInvoice(ublData, {
      env,
      credentials,
      signerCredentials,
    });

    // Guardar los artefactos y estado en base de datos
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ublXml: result.ublXml,
        signedXml: result.signedXml,
        sunatCdr: result.sendResult.cdr?.rawXml || result.sendResult.cdrBase64 || null,
        sunatCode: result.sendResult.sunatCode,
        sunatMessage: result.sendResult.sunatMessage,
        status: result.sendResult.status as any,
        sentAt: result.sendResult.sentAt,
      },
    });

    return updatedInvoice;
  }

  /**
   * Lista comprobantes con paginación y filtros para un tenant
   */
  async findAll(academyId: string, query: QueryInvoiceDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { academyId };
    if (query.type) where.invoiceType = query.type;
    if (query.status) where.status = query.status;
    if (query.series) where.series = query.series;

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene un comprobante por ID
   */
  async findById(id: string, academyId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, academyId },
    });

    if (!invoice) {
      throw new NotFoundException(`Comprobante ${id} no encontrado`);
    }

    return invoice;
  }

  /**
   * Consulta el estado de un comprobante en base de datos y detalle de CDR
   */
  async getInvoiceStatus(id: string, academyId: string) {
    const invoice = await this.findById(id, academyId);
    return {
      id: invoice.id,
      document: `${invoice.series}-${invoice.correlative.toString().padStart(8, '0')}`,
      type: invoice.invoiceType,
      status: invoice.status,
      sunatCode: invoice.sunatCode,
      sunatMessage: invoice.sunatMessage,
      attempts: invoice.attempts,
      sentAt: invoice.sentAt,
      hasCdr: !!invoice.sunatCdr,
      hasSignedXml: !!invoice.signedXml,
    };
  }

  /**
   * Endpoint interactivo para probar la integración real con SUNAT Beta
   * Soporta Factura, Boleta, Nota de Crédito y Nota de Débito
   */
  async testSunatBeta(payload?: any) {
    const docType: SunatDocumentType = payload?.docType || '03'; // Default Boleta
    const ruc = payload?.ruc || process.env.SUNAT_RUC || '20000000001';
    const series = payload?.series || (docType === '01' ? 'F001' : docType === '03' ? 'B001' : docType === '07' ? 'FC01' : 'FD01');
    const correlative = payload?.correlative || Math.floor(Math.random() * 900000) + 10000;

    const testUblData: UblInvoiceData = {
      documentType: docType,
      series,
      correlative,
      issueDate: new Date().toISOString().slice(0, 10),
      issueTime: new Date().toTimeString().slice(0, 8),
      currency: 'PEN',
      company: {
        ruc,
        legalName: 'ACADEMIA DEPORTIVA DEMO S.A.C.',
        commercialName: 'ACADEMIA DEMO',
        address: 'CALLE LOS DEPORTISTAS 123',
        district: 'MIRAFLORES',
        province: 'LIMA',
        department: 'LIMA',
      },
      client: {
        docType: docType === '01' ? '6' : '1',
        docNumber: docType === '01' ? '20555555551' : '72345678',
        name: docType === '01' ? 'CLIENTE EMPRESA PRUEBA S.A.C.' : 'JUAN PEREZ GARCIA',
        address: 'AV. PRINCIPAL 456',
      },
      items: [
        {
          id: 1,
          description: 'Servicio de Entrenamiento Deportivo - SUNAT Beta Test',
          unitCode: 'ZZ',
          quantity: 1,
          unitPrice: 118.0,
          unitPriceWithoutIgv: 100.0,
          subtotal: 100.0,
          igv: 18.0,
          total: 118.0,
        },
      ],
      subtotal: 100.0,
      igv: 18.0,
      total: 118.0,
    };

    if (docType === '07' || docType === '08') {
      testUblData.discrepancyResponse = {
        referenceId: 'F001-00000001',
        responseCode: '01',
        description: docType === '07' ? 'Anulación de la operación' : 'Intereses por mora',
      };
      testUblData.billingReference = {
        documentId: 'F001-00000001',
        documentTypeCode: '01',
      };
    }

    return await this.sunatService.processAndSendInvoice(testUblData, {
      env: 'BETA',
    });
  }
}
