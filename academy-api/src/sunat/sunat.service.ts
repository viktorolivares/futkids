import { Injectable, Logger } from '@nestjs/common';
import { UblGeneratorService } from './ubl/ubl-generator.service';
import { XmlSignerService, SignerCredentials, SignatureResult } from './signer/xml-signer.service';
import { ZipPackagerService, ZipPackage } from './packager/zip-packager.service';
import { SunatClientFactory } from './client/sunat-client.factory';
import { ISunatClient } from './client/sunat-client.interface';
import {
  UblInvoiceData,
  SunatSendResult,
  SunatDocumentType,
  CdrResult,
} from './types/sunat.types';
import {
  SunatBaseException,
  SunatRejectionException,
} from './exceptions/sunat.exceptions';

export interface SunatProcessingOptions {
  client?: ISunatClient;
  env?: 'BETA' | 'PRODUCTION';
  credentials?: {
    username?: string;
    password?: string;
  };
  signerCredentials?: SignerCredentials;
}

@Injectable()
export class SunatService {
  private readonly logger = new Logger(SunatService.name);

  constructor(
    private readonly ublGenerator: UblGeneratorService,
    private readonly xmlSigner: XmlSignerService,
    private readonly zipPackager: ZipPackagerService,
    private readonly clientFactory: SunatClientFactory,
  ) {}

  /**
   * Ejecuta el ciclo completo de emisión electrónica SUNAT:
   * 1. Generación de XML UBL 2.1
   * 2. Firma Digital con XML-DSig
   * 3. Empaquetado en ZIP
   * 4. Envío SOAP a SUNAT (Beta / Producción)
   * 5. Descompresión y análisis del CDR
   * 6. Retorno de estados y artefactos para persistencia
   */
  async processAndSendInvoice(
    invoiceData: UblInvoiceData,
    options?: SunatProcessingOptions,
  ): Promise<{
    ublXml: string;
    signedXml: string;
    digestValue: string;
    zipPackage: ZipPackage;
    sendResult: SunatSendResult;
  }> {
    const ruc = invoiceData.company.ruc;
    const docType = invoiceData.documentType;
    const series = invoiceData.series;
    const correlative = invoiceData.correlative;

    this.logger.log(
      `Iniciando procesamiento SUNAT para ${docType}-${series}-${correlative} (RUC: ${ruc})`,
    );

    // 1. Generar XML UBL 2.1
    const ublXml = this.ublGenerator.generateXml(invoiceData);

    // 2. Firmar digitalmente
    const signResult = this.xmlSigner.signXml(ublXml, options?.signerCredentials);

    // 3. Empaquetar en archivo ZIP
    const zipPackage = this.zipPackager.packageXml(
      signResult.signedXml,
      ruc,
      docType,
      series,
      correlative,
    );

    // 4. Seleccionar cliente SUNAT
    const client =
      options?.client ||
      this.clientFactory.getClient(options?.env);

    // 5. Enviar a SUNAT
    const sentAt = new Date();
    let sendResult: SunatSendResult;

    try {
      const soapResponse = await client.sendBill(
        zipPackage.fileName,
        zipPackage.zipBase64,
        options?.credentials,
      );

      // Si SUNAT retornó el CDR en Base64
      if (soapResponse.applicationResponseBase64) {
        const cdr = this.zipPackager.extractCdr(soapResponse.applicationResponseBase64);

        sendResult = {
          success: cdr.isAccepted,
          status: cdr.isAccepted ? 'ACCEPTED' : 'REJECTED',
          sunatCode: cdr.responseCode,
          sunatMessage: cdr.description,
          fileName: zipPackage.fileName,
          zipBase64: zipPackage.zipBase64,
          cdrBase64: soapResponse.applicationResponseBase64,
          cdr,
          digestValue: signResult.digestValue,
          sentAt,
          rawSoapResponse: soapResponse.rawResponse,
        };

        this.logger.log(
          `Comprobante procesado por SUNAT: Código ${cdr.responseCode} - ${cdr.description}`,
        );
      } else {
        // En caso de que se haya enviado con éxito pero sin CDR sincrónico (ej. resumen de boletas)
        sendResult = {
          success: true,
          status: 'ACCEPTED',
          sunatCode: '0',
          sunatMessage: 'Comprobante recibido satisfactoriamente por SUNAT',
          fileName: zipPackage.fileName,
          zipBase64: zipPackage.zipBase64,
          digestValue: signResult.digestValue,
          sentAt,
          rawSoapResponse: soapResponse.rawResponse,
        };
      }
    } catch (err: any) {
      if (err instanceof SunatBaseException) {
        // Si es un rechazo o error controlado de SUNAT, armamos el resultado trazable
        sendResult = {
          success: false,
          status: 'REJECTED',
          sunatCode: (err as any).sunatCode || (err as any).errorCode || '-1',
          sunatMessage: err.message,
          fileName: zipPackage.fileName,
          zipBase64: zipPackage.zipBase64,
          digestValue: signResult.digestValue,
          sentAt,
          errorDetails: JSON.stringify(err.getResponse?.() || err.message),
        };
        this.logger.warn(`Envío fallido a SUNAT: ${err.message}`);
      } else {
        throw err;
      }
    }

    return {
      ublXml,
      signedXml: signResult.signedXml,
      digestValue: signResult.digestValue,
      zipPackage,
      sendResult,
    };
  }

  // Delegados auxiliares
  generateXml(data: UblInvoiceData): string {
    return this.ublGenerator.generateXml(data);
  }

  signXml(xml: string, credentials?: SignerCredentials): SignatureResult {
    return this.xmlSigner.signXml(xml, credentials);
  }

  packageXml(
    signedXml: string,
    ruc: string,
    docType: SunatDocumentType,
    series: string,
    correlative: number,
  ): ZipPackage {
    return this.zipPackager.packageXml(signedXml, ruc, docType, series, correlative);
  }

  extractCdr(cdrBase64: string): CdrResult {
    return this.zipPackager.extractCdr(cdrBase64);
  }
}
