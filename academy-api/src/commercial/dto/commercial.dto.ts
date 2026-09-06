import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePackageDto {
  @ApiProperty({ example: 'Pack 10 Clases + 2 Bonus' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  classCount: number;

  @ApiPropertyOptional({ example: 2, default: 0 })
  @IsNumber()
  @IsOptional()
  bonusClasses?: number;

  @ApiProperty({ example: 280.0 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 60, default: 60 })
  @IsNumber()
  @IsOptional()
  validityDays?: number;
}

export class CreatePromotionDto {
  @ApiProperty({ example: 'VERANO2026' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Descuento Campaña Verano' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '15% de descuento en matrícula' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 15.0 })
  @IsNumber()
  @IsOptional()
  discountPct?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  discountFixed?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  bonusClasses?: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-03-31' })
  @IsDateString()
  endDate: string;
}
