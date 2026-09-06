import { HttpException, HttpStatus } from '@nestjs/common';

export abstract class SunatBaseException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    public readonly errorCode: string,
    public readonly details?: any,
  ) {
    super(
      {
        statusCode: status,
        error: 'SunatError',
        code: errorCode,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

export class SunatInvalidXmlException extends SunatBaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'SUNAT_INVALID_XML', details);
  }
}

export class SunatInvalidSignatureException extends SunatBaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'SUNAT_INVALID_SIGNATURE', details);
  }
}

export class SunatInvalidZipException extends SunatBaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'SUNAT_INVALID_ZIP', details);
  }
}

export class SunatAuthenticationException extends SunatBaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.UNAUTHORIZED, 'SUNAT_AUTH_ERROR', details);
  }
}

export class SunatCommunicationException extends SunatBaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_GATEWAY, 'SUNAT_COMMUNICATION_ERROR', details);
  }
}

export class SunatTimeoutException extends SunatBaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.GATEWAY_TIMEOUT, 'SUNAT_TIMEOUT', details);
  }
}

export class SunatInvalidSoapResponseException extends SunatBaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_GATEWAY, 'SUNAT_INVALID_SOAP_RESPONSE', details);
  }
}

export class SunatRejectionException extends SunatBaseException {
  constructor(
    message: string,
    public readonly sunatCode: string,
    details?: any,
  ) {
    super(
      `Comprobante rechazado por SUNAT [Código ${sunatCode}]: ${message}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
      'SUNAT_REJECTION',
      { sunatCode, ...(details || {}) },
    );
  }
}

export class SunatDuplicateException extends SunatBaseException {
  constructor(message: string, details?: any) {
    super(
      `Comprobante ya fue informado anteriormente a SUNAT (código 1033): ${message}`,
      HttpStatus.CONFLICT,
      'SUNAT_DUPLICATE_DOCUMENT',
      details,
    );
  }
}
