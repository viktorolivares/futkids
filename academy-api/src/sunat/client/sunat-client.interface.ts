export interface SunatSoapResponse {
  applicationResponseBase64?: string; // CDR zip en Base64
  ticket?: string;
  rawResponse: string;
  statusCode: number;
}

export interface ISunatClient {
  readonly envName: 'BETA' | 'PRODUCTION';
  readonly serviceUrl: string;

  sendBill(
    fileName: string,
    zipBase64: string,
    credentials?: { username?: string; password?: string },
  ): Promise<SunatSoapResponse>;

  getStatus?(
    ticket: string,
    credentials?: { username?: string; password?: string },
  ): Promise<SunatSoapResponse>;
}
