import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvoicesService } from '../src/invoices/invoices.service';
import { InvoiceTypeEnum } from '../src/invoices/dto/create-invoice.dto';

describe('InvoicesService (Gestión y Ciclo de Vida de Comprobantes)', () => {
  let service: InvoicesService;
  let mockPrisma: any;
  let mockSunatService: any;

  beforeEach(() => {
    mockPrisma = {
      billingSetting: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'billing-1',
          academyId: 'academy-123',
          solUser: 'MODDATOS',
          solPassword: 'moddatos',
          ruc: '20000000001',
          environment: 'BETA',
          boletaSeries: 'B001',
          facturaSeries: 'F001',
          notaCreditoSeries: 'NC01',
          notaDebitoSeries: 'ND01',
        }),
        create: vi.fn(),
      },
      invoice: {
        findFirst: vi.fn().mockResolvedValue({ correlative: 41 }),
        findUnique: vi.fn().mockResolvedValue({
          id: 'inv-1',
          academyId: 'academy-123',
          invoiceType: 'BOLETA',
          series: 'B001',
          correlative: 42,
          clientDocType: '1',
          clientDocNum: '72345678',
          clientName: 'Juan Perez',
          clientAddress: 'Av. Larco 123',
          subtotal: 100.0,
          igv: 18.0,
          total: 118.0,
          status: 'PENDING',
          issuedAt: new Date('2026-03-01T12:00:00Z'),
          items: [
            {
              id: 1,
              description: 'Clases de Tenis',
              unitCode: 'ZZ',
              quantity: 1,
              unitPrice: 118.0,
              unitPriceWithoutIgv: 100.0,
              subtotal: 100.0,
              igv: 18.0,
              total: 118.0,
            },
          ],
          academy: {
            id: 'academy-123',
            name: 'Club de Tenis Lima',
            ruc: '20000000001',
            address: 'Calle Tenis 100',
          },
        }),
        create: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'inv-new',
            ...data,
          }),
        ),
        update: vi.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({
            id: where.id,
            ...data,
          }),
        ),
      },
    };

    mockSunatService = {
      processAndSendInvoice: vi.fn().mockResolvedValue({
        ublXml: '<Invoice>UBL</Invoice>',
        signedXml: '<Invoice><ds:Signature/>UBL</Invoice>',
        digestValue: 'TEST_DIGEST==',
        sendResult: {
          success: true,
          status: 'ACCEPTED',
          sunatCode: '0',
          sunatMessage: 'La Boleta de Venta numero B001-00000042, ha sido aceptada',
          fileName: '20000000001-03-B001-00000042.zip',
          cdrBase64: 'BASE64_CDR_TEST',
          cdr: {
            isAccepted: true,
            responseCode: '0',
            description: 'La Boleta de Venta numero B001-00000042, ha sido aceptada',
            rawXml: '<ApplicationResponse>CDR</ApplicationResponse>',
          },
          sentAt: new Date(),
        },
      }),
    };

    service = new InvoicesService(mockPrisma, mockSunatService);
  });

  it('debe crear un comprobante con el correlativo correlativo secuencial y procesarlo con SUNAT', async () => {
    const result = await service.create(
      {
        invoiceType: InvoiceTypeEnum.BOLETA,
        clientDocType: '1',
        clientDocNum: '72345678',
        clientName: 'Juan Perez',
        items: [
          {
            description: 'Clases de Tenis',
            unitCode: 'ZZ',
            quantity: 1,
            unitPrice: 118.0,
          },
        ],
        sendImmediately: true,
      },
      'academy-123',
    );

    expect(mockPrisma.invoice.create).toHaveBeenCalled();
    // Verificamos que el correlativo asignado sea 42 (el anterior fue 41)
    const createCallArgs = mockPrisma.invoice.create.mock.calls[0][0].data;
    expect(createCallArgs.correlative).toBe(42);
    expect(createCallArgs.series).toBe('B001');

    // Verificamos que se ejecutó el despacho a SUNAT y se persistieron los artefactos
    expect(mockSunatService.processAndSendInvoice).toHaveBeenCalled();
    expect(mockPrisma.invoice.update).toHaveBeenCalled();

    const updateCallArgs = mockPrisma.invoice.update.mock.calls[1][0].data;
    expect(updateCallArgs.status).toBe('ACCEPTED');
    expect(updateCallArgs.sunatCode).toBe('0');
    expect(updateCallArgs.sunatMessage).toContain('ha sido aceptada');
  });

  it('debe mapear correctamente los tipos de comprobante de la academia a códigos SUNAT', () => {
    expect(service.mapInvoiceTypeToSunat(InvoiceTypeEnum.FACTURA)).toBe('01');
    expect(service.mapInvoiceTypeToSunat(InvoiceTypeEnum.BOLETA)).toBe('03');
    expect(service.mapInvoiceTypeToSunat(InvoiceTypeEnum.NOTA_CREDITO)).toBe('07');
    expect(service.mapInvoiceTypeToSunat(InvoiceTypeEnum.NOTA_DEBITO)).toBe('08');
  });
});
