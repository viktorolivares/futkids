import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateMembershipDto {
  @ApiProperty({ example: 'usr-coach-123' })
  @IsUUID()
  @IsNotEmpty({ message: 'El userId es obligatorio' })
  userId: string;

  @ApiProperty({
    example: 'COACH',
    enum: ['OWNER', 'ADMIN', 'COACH', 'CASHIER', 'STAFF', 'PARENT'],
    description: 'Rol que desempeñará el usuario en esta academia',
  })
  @IsEnum(Role, { message: 'El rol debe ser uno de: OWNER, ADMIN, COACH, CASHIER, STAFF, PARENT' })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  role: Role;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
