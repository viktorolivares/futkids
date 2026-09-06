import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'Mateo' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Pérez Quispe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '2016-05-15' })
  @IsDateString()
  birthDate: string;

  @ApiPropertyOptional({ example: 'DNI', default: 'DNI' })
  @IsString()
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional({ example: '72345678' })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({ example: '+51 987 654 321' })
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiPropertyOptional({ example: 'Alergia leve a la penicilina' })
  @IsString()
  @IsOptional()
  medicalNotes?: string;

  @ApiPropertyOptional({ example: 'fam-demo-01' })
  @IsString()
  @IsOptional()
  familyId?: string;

  @ApiPropertyOptional({ example: 'grp-sub10-01' })
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ example: 150.0 })
  @IsNumber()
  @IsOptional()
  monthlyFee?: number;

  @ApiPropertyOptional({ example: 'Carlos Pérez (Padre)' })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({ example: 'carlos.perez@email.com' })
  @IsString()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+51 987 654 321' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
