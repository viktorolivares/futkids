import { ApiProperty } from '@nestjs/swagger';

export class MembershipDto {
  @ApiProperty({ example: 'acad-alianza-01' })
  academyId: string;

  @ApiProperty({ example: 'Academia Alianza Lima - Sede Matute' })
  academyName: string;

  @ApiProperty({ example: 'OWNER', enum: ['OWNER', 'ADMIN', 'COACH', 'CASHIER', 'STAFF', 'PARENT'] })
  role: string;

  @ApiProperty({ example: true })
  isDefault: boolean;
}

export class UserProfileDto {
  @ApiProperty({ example: 'usr-001' })
  id: string;

  @ApiProperty({ example: 'carlos.mendoza@alianzalima.pe' })
  email: string;

  @ApiProperty({ example: 'Carlos' })
  firstName: string;

  @ApiProperty({ example: 'Mendoza' })
  lastName: string;

  @ApiProperty({ type: [MembershipDto] })
  memberships: MembershipDto[];
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT Access Token de corta duración (1d)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT Refresh Token de larga duración (7d)' })
  refreshToken: string;

  @ApiProperty({ example: 86400, description: 'Tiempo de expiración en segundos' })
  expiresIn: number;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
