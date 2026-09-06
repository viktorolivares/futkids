import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { SunatModule } from '../sunat/sunat.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, SunatModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
