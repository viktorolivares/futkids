import { Module } from '@nestjs/common';
import { UblGeneratorService } from './ubl/ubl-generator.service';
import { XmlSignerService } from './signer/xml-signer.service';
import { ZipPackagerService } from './packager/zip-packager.service';
import { SunatBetaClient } from './client/sunat-beta.client';
import { SunatProductionClient } from './client/sunat-production.client';
import { SunatClientFactory } from './client/sunat-client.factory';
import { SunatService } from './sunat.service';

@Module({
  providers: [
    UblGeneratorService,
    XmlSignerService,
    ZipPackagerService,
    SunatBetaClient,
    SunatProductionClient,
    SunatClientFactory,
    SunatService,
  ],
  exports: [
    SunatService,
    UblGeneratorService,
    XmlSignerService,
    ZipPackagerService,
    SunatClientFactory,
    SunatBetaClient,
    SunatProductionClient,
  ],
})
export class SunatModule {}
