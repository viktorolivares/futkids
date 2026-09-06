import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, Matches, IsEmail } from 'class-validator';

export class CreateAcademyDto {
  @ApiProperty({ example: 'Academia Alianza Lima - Sede Matute' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la academia es obligatorio' })
  name: string;

  @ApiProperty({ example: 'alianza-lima-matute' })
  @IsString()
  @IsNotEmpty({ message: 'El slug identificador es obligatorio' })
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo puede contener letras minúsculas, números y guiones' })
  slug: string;

  @ApiPropertyOptional({ example: 'CLUB ALIANZA LIMA S.A.' })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiPropertyOptional({ example: '20100123456' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{11}$/, { message: 'El RUC debe tener 11 dígitos numéricos válidos' })
  ruc?: string;

  @ApiPropertyOptional({ example: '+51987654321' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contacto@alianzalima.pe' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Jr. Isabel La Católica 840, La Victoria' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Lima' })
  @IsString()
  @IsOptional()
  city?: string;
}
