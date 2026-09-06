import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChargeDto {
  @ApiProperty({ example: 'student-id' })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ example: 'family-id' })
  @IsString()
  @IsOptional()
  familyId?: string;

  @ApiProperty({ example: 'MONTHLY', enum: ['MONTHLY', 'ENROLLMENT', 'UNIFORM', 'PACKAGE', 'EVENT', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  chargeType: 'MONTHLY' | 'ENROLLMENT' | 'UNIFORM' | 'PACKAGE' | 'EVENT' | 'OTHER';

  @ApiProperty({ example: 'Mensualidad Marzo 2026 - Mateo Pérez' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ example: '2026-03-28' })
  @IsDateString()
  dueDate: string;
}

export class AllocationItemDto {
  @ApiProperty({ example: 'charge-id' })
  @IsString()
  chargeId: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  amount: number;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'student-id' })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ example: 'family-id' })
  @IsString()
  @IsOptional()
  familyId?: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'YAPE', enum: ['YAPE', 'PLIN', 'CASH', 'CARD', 'BANK_TRANSFER', 'CUSTOMER_CREDIT'] })
  @IsString()
  @IsNotEmpty()
  paymentMethod: 'YAPE' | 'PLIN' | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CUSTOMER_CREDIT';

  @ApiPropertyOptional({ example: 'OP-983421' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: 'Pago por aplicativo Yape verificado' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [AllocationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationItemDto)
  @IsOptional()
  allocations?: AllocationItemDto[];

  @ApiPropertyOptional({ example: 'BOLETA', enum: ['BOLETA', 'FACTURA', 'RECIBO', 'NONE'] })
  @IsString()
  @IsOptional()
  invoiceType?: string;
}

export class CreateRefundDto {
  @ApiProperty({ example: 'payment-id' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ example: 50.0 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Retiro voluntario justificado' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
