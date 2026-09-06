import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'Carlos Pérez' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+51 987 654 321' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'carlos.perez@email.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'PADRE', default: 'PADRE' })
  @IsString()
  @IsOptional()
  relationship?: string;

  @ApiPropertyOptional({ example: '09876543' })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateFamilyDto {
  @ApiProperty({ example: 'Familia Pérez Quispe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'FAM-001' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'Apoderado principal recoge los martes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateContactDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  @IsOptional()
  contacts?: CreateContactDto[];
}
