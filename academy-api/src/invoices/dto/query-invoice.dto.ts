import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceTypeEnum } from './create-invoice.dto';

export class QueryInvoiceDto {
  @ApiPropertyOptional({ enum: InvoiceTypeEnum, description: 'Filtrar por tipo de comprobante' })
  @IsEnum(InvoiceTypeEnum)
  @IsOptional()
  type?: InvoiceTypeEnum;

  @ApiPropertyOptional({ description: 'Filtrar por estado (PENDING, PROCESSING, ACCEPTED, REJECTED, CANCELLED)' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filtrar por serie (ej: B001, F001)' })
  @IsString()
  @IsOptional()
  series?: string;

  @ApiPropertyOptional({ description: 'Página actual', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Registros por página', default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
