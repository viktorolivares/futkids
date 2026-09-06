import { ApiProperty } from '@nestjs/swagger';

export class PlanFeatureDto {
  @ApiProperty({ example: 'SUNAT_BILLING' })
  key: string;

  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ example: 'Emisión electrónica directa a SUNAT', required: false })
  description?: string;

  @ApiProperty({ example: null, required: false })
  limitValue?: number;
}

export class PlanDto {
  @ApiProperty({ example: 'uuid-plan-pro' })
  id: string;

  @ApiProperty({ example: 'PRO' })
  code: string;

  @ApiProperty({ example: 'Pro' })
  name: string;

  @ApiProperty({ example: 'Plan completo para academias sin límites operativos' })
  description?: string;

  @ApiProperty({ example: 99.0 })
  priceMonthly: number;

  @ApiProperty({ example: 'PEN' })
  currency: string;

  @ApiProperty({ example: null, nullable: true })
  maxStudents: number | null;

  @ApiProperty({ example: null, nullable: true })
  maxGroups: number | null;

  @ApiProperty({ example: null, nullable: true })
  maxSports: number | null;

  @ApiProperty({ example: 10, nullable: true })
  maxUsers: number | null;

  @ApiProperty({ type: [PlanFeatureDto] })
  features: PlanFeatureDto[];
}
