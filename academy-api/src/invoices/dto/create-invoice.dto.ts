import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceTypeEnum {
  FACTURA = 'FACTURA',
  BOLETA = 'BOLETA',
  NOTA_CREDITO = 'NOTA_CREDITO',
  NOTA_DEBITO = 'NOTA_DEBITO',
}

export class InvoiceItemDto {
  @ApiProperty({ description: 'Descripción del ítem o servicio', example: 'Matrícula Torneo Verano 2026' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Código de unidad (NIU: bienes/unidades, ZZ: servicios)', example: 'ZZ', default: 'ZZ' })
  @IsString()
  @IsOptional()
  unitCode?: string = 'ZZ';

  @ApiProperty({ description: 'Cantidad', example: 1 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: 'Precio unitario con IGV incluido', example: 118.00 })
  @IsNumber()
  @Min(0.01)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({ description: 'ID del pago asociado en el sistema' })
  @IsString()
  @IsOptional()
  paymentId?: string;

  @ApiProperty({
    description: 'Tipo de comprobante electrónico',
    enum: InvoiceTypeEnum,
    example: InvoiceTypeEnum.BOLETA,
  })
  @IsEnum(InvoiceTypeEnum)
  invoiceType: InvoiceTypeEnum;

  @ApiPropertyOptional({
    description: 'Serie del comprobante (ej: B001, F001, FC01, FD01). Si no se provee, se toma de BillingSetting',
    example: 'B001',
  })
  @IsString()
  @IsOptional()
  series?: string;

  @ApiProperty({
    description: 'Tipo de documento de identidad del cliente (1: DNI, 6: RUC, 4: CE, 7: Pasaporte, 0: Sin Doc)',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  clientDocType: string;

  @ApiProperty({ description: 'Número de documento de identidad del cliente', example: '72345678' })
  @IsString()
  @IsNotEmpty()
  clientDocNum: string;

  @ApiProperty({ description: 'Nombre o Razón Social del cliente', example: 'Juan Pérez García' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiPropertyOptional({ description: 'Dirección del cliente', example: 'Av. Larco 456, Miraflores' })
  @IsString()
  @IsOptional()
  clientAddress?: string;

  @ApiProperty({
    description: 'Lista de ítems o conceptos a facturar',
    type: [InvoiceItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  // Campos para Nota de Crédito / Débito
  @ApiPropertyOptional({ description: 'Serie del comprobante modificado (ej: F001)', example: 'F001' })
  @IsString()
  @IsOptional()
  referenceSeries?: string;

  @ApiPropertyOptional({ description: 'Correlativo del comprobante modificado (ej: 42)', example: 42 })
  @IsNumber()
  @IsOptional()
  referenceCorrelative?: number;

  @ApiPropertyOptional({
    description: 'Código de motivo de Nota de Crédito (Catálogo 09) o Débito (Catálogo 10). Ej: 01',
    example: '01',
  })
  @IsString()
  @IsOptional()
  referenceCode?: string;

  @ApiPropertyOptional({ description: 'Descripción del motivo o sustento de la nota', example: 'Anulación de la operación' })
  @IsString()
  @IsOptional()
  referenceReason?: string;

  @ApiPropertyOptional({
    description: 'Indica si se envía a SUNAT de forma inmediata sincrónica o mediante cola BullMQ',
    default: true,
  })
  @IsOptional()
  sendImmediately?: boolean = true;
}
