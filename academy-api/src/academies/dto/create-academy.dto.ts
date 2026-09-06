import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, Matches, IsEmail } from 'class-validator';

export class CreateAcademyDto {
  @ApiProperty({ example: 'Academia Deportiva Demo Central' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la academia es obligatorio' })
  name: string;

  @ApiPropertyOptional({ example: 'demo' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo puede contener letras minúsculas, números y guiones' })
  slug?: string;

  @ApiPropertyOptional({ example: 'ACADEMIA DEPORTIVA DEMO S.A.C.' })
  @IsString()
  @IsOptional()
  legalName?: string;

  @ApiPropertyOptional({ example: '20123456789' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{11}$/, { message: 'El RUC debe tener 11 dígitos numéricos válidos' })
  ruc?: string;

  @ApiPropertyOptional({ example: '+51987654321' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contacto@demo.pe' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Av. Javier Prado Este 2500, San Borja' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Lima' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Lima' })
  @IsString()
  @IsOptional()
  department?: string;
}
