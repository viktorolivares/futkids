import { Injectable } from '@nestjs/common';
import { SunatSoapClient } from './sunat-soap.client';
import { getSunatConfig } from '../config/sunat.config';

@Injectable()
export class SunatProductionClient extends SunatSoapClient {
  constructor() {
    const config = getSunatConfig({ env: 'PRODUCTION' });
    super(
      'PRODUCTION',
      config.serviceUrl,
      config.username,
      config.password,
      config.timeoutMs,
    );
  }
}
