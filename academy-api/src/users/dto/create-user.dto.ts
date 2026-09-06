import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'juan.perez@example.pe' })
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 6 })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName: string;

  @ApiPropertyOptional({ example: 'DNI' })
  @IsString()
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional({ example: '72345678' })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({ example: '+51999888777' })
  @IsString()
  @IsOptional()
  phone?: string;
}
