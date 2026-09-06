import { Injectable } from '@nestjs/common';
import { ISunatClient } from './sunat-client.interface';
import { SunatBetaClient } from './sunat-beta.client';
import { SunatProductionClient } from './sunat-production.client';
import { SunatSoapClient } from './sunat-soap.client';
import { getSunatConfig, SunatConfigOptions } from '../config/sunat.config';

@Injectable()
export class SunatClientFactory {
  constructor(
    private readonly betaClient: SunatBetaClient,
    private readonly productionClient: SunatProductionClient,
  ) {}

  /**
   * Obtiene el cliente predeterminado según el entorno configurado (SUNAT_ENV)
   */
  getClient(env?: 'BETA' | 'PRODUCTION'): ISunatClient {
    const targetEnv = env || (process.env.SUNAT_ENV?.toUpperCase() === 'PRODUCTION' ? 'PRODUCTION' : 'BETA');
    return targetEnv === 'PRODUCTION' ? this.productionClient : this.betaClient;
  }

  /**
   * Crea un cliente ad-hoc para un tenant con configuraciones específicas de BillingSetting
   */
  createClientForTenant(options?: Partial<SunatConfigOptions>): ISunatClient {
    const config = getSunatConfig(options);
    return new SunatSoapClient(
      config.env,
      config.serviceUrl,
      config.username,
      config.password,
      config.timeoutMs,
    );
  }
}
