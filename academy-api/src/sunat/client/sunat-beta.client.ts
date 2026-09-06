import { Injectable } from '@nestjs/common';
import { SunatSoapClient } from './sunat-soap.client';
import { getSunatConfig } from '../config/sunat.config';

@Injectable()
export class SunatBetaClient extends SunatSoapClient {
  constructor() {
    const config = getSunatConfig({ env: 'BETA' });
    super(
      'BETA',
      config.serviceUrl,
      config.username,
      config.password,
      config.timeoutMs,
    );
  }
}
