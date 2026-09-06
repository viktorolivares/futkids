import { Logger } from '@nestjs/common';
import { ISunatClient, SunatSoapResponse } from './sunat-client.interface';
import {
  SunatAuthenticationException,
  SunatCommunicationException,
  SunatDuplicateException,
  SunatInvalidSoapResponseException,
  SunatRejectionException,
  SunatTimeoutException,
} from '../exceptions/sunat.exceptions';

export class SunatSoapClient implements ISunatClient {
  protected readonly logger = new Logger(SunatSoapClient.name);

  constructor(
    public readonly envName: 'BETA' | 'PRODUCTION',
    public readonly serviceUrl: string,
    protected readonly defaultUsername: string,
    protected readonly defaultPassword: string,
    protected readonly timeoutMs: number = 30000,
  ) {}

  /**
   * Envía un archivo ZIP con el comprobante electrónico a SUNAT mediante SOAP sendBill
   */
  async sendBill(
    fileName: string,
    zipBase64: string,
    credentials?: { username?: string; password?: string },
  ): Promise<SunatSoapResponse> {
    const username = credentials?.username || this.defaultUsername;
    const password = credentials?.password || this.defaultPassword;

    const soapEnvelope = this.buildSendBillEnvelope(fileName, zipBase64, username, password);

    this.logger.log(
      `[SUNAT ${this.envName}] Enviando sendBill: ${fileName} a ${this.serviceUrl}`,
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    let responseText: string;

    try {
      response = await fetch(this.serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=ISO-8859-1',
          SOAPAction: 'urn:sendBill',
        },
        body: soapEnvelope,
        signal: controller.signal,
      });

      responseText = await response.text();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new SunatTimeoutException(
          `Timeout de comunicación con SUNAT (${this.timeoutMs}ms) al enviar ${fileName}`,
          { fileName, serviceUrl: this.serviceUrl },
        );
      }
      throw new SunatCommunicationException(
        `Error de conexión con el webservice de SUNAT (${this.serviceUrl}): ${err.message}`,
        { fileName, serviceUrl: this.serviceUrl, originalError: err.message },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    return this.processSoapResponse(response.status, responseText, fileName);
  }

  /**
   * Construye el mensaje SOAP Envelope con WS-Security UsernameToken
   */
  protected buildSendBillEnvelope(
    fileName: string,
    zipBase64: string,
    username: string,
    password: string,
  ): string {
    return `<?xml version="1.0" encoding="ISO-8859-1"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ser="http://service.sunat.gob.pe"
  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password>${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:sendBill>
      <fileName>${fileName}</fileName>
      <contentFile>${zipBase64}</contentFile>
    </ser:sendBill>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Analiza la respuesta HTTP y el XML SOAP devuelto por SUNAT
   */
  protected processSoapResponse(
    statusCode: number,
    responseText: string,
    fileName: string,
  ): SunatSoapResponse {
    // 1. Revisar si hay un SOAP Fault
    if (
      responseText.includes('<soap-env:Fault>') ||
      responseText.includes('<soapenv:Fault>') ||
      responseText.includes('<Fault>')
    ) {
      this.handleSoapFault(responseText, fileName);
    }

    // 2. Extraer applicationResponse (Base64 del CDR)
    const match = responseText.match(
      /<applicationResponse>([\s\S]*?)<\/applicationResponse>/i,
    );
    if (match && match[1]) {
      const applicationResponseBase64 = match[1].trim();
      return {
        statusCode,
        rawResponse: responseText,
        applicationResponseBase64,
      };
    }

    // Si status no es 200 y no pudimos extraer applicationResponse
    if (statusCode !== 200) {
      throw new SunatInvalidSoapResponseException(
        `SUNAT retornó código HTTP ${statusCode} sin CDR válido.`,
        { statusCode, responseText, fileName },
      );
    }

    return {
      statusCode,
      rawResponse: responseText,
    };
  }

  /**
   * Mapea los códigos y cadenas de error SOAP Fault a excepciones de dominio
   */
  protected handleSoapFault(soapResponse: string, fileName: string): void {
    const codeMatch =
      soapResponse.match(/<faultcode>([\s\S]*?)<\/faultcode>/i) ||
      soapResponse.match(/<faultcode[^>]*>([\s\S]*?)<\/faultcode>/i);
    const stringMatch =
      soapResponse.match(/<faultstring>([\s\S]*?)<\/faultstring>/i) ||
      soapResponse.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i);

    const faultCode = codeMatch ? codeMatch[1].trim() : 'UNKNOWN_FAULT';
    const faultString = stringMatch ? stringMatch[1].trim() : 'Error desconocido de SUNAT';

    this.logger.error(
      `[SUNAT ${this.envName}] SOAP Fault recibido para ${fileName}: [${faultCode}] ${faultString}`,
    );

    // Detección de comprobante duplicado (código 1033)
    if (
      faultCode.includes('1033') ||
      faultString.toLowerCase().includes('ya fue informado') ||
      faultString.toLowerCase().includes('duplicado')
    ) {
      throw new SunatDuplicateException(faultString, { faultCode, faultString, fileName });
    }

    // Detección de error de credenciales / autenticación (código 0100 o similar)
    if (
      faultCode.includes('0100') ||
      faultString.toLowerCase().includes('el ruc no coincide') ||
      faultString.toLowerCase().includes('credenciales') ||
      faultString.toLowerCase().includes('usuario o contras')
    ) {
      throw new SunatAuthenticationException(faultString, { faultCode, faultString, fileName });
    }

    // Cualquier otro rechazo de SUNAT
    throw new SunatRejectionException(faultString, faultCode, {
      faultCode,
      faultString,
      fileName,
    });
  }
}
