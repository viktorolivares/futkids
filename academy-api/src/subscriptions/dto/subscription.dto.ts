import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class TrialInfoDto {
  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2026-09-05T00:00:00Z', nullable: true })
  startsAt: string | null;

  @ApiProperty({ example: '2026-09-19T00:00:00Z', nullable: true })
  endsAt: string | null;

  @ApiProperty({ example: 14 })
  remainingDays: number;
}

export class PlanLimitsDto {
  @ApiProperty({ example: 30, nullable: true })
  students: number | null;

  @ApiProperty({ example: 2, nullable: true })
  groups: number | null;

  @ApiProperty({ example: 1, nullable: true })
  sports: number | null;

  @ApiProperty({ example: 2, nullable: true })
  users: number | null;
}

export class AcademyUsageDto {
  @ApiProperty({ example: 18 })
  students: number;

  @ApiProperty({ example: 2 })
  groups: number;

  @ApiProperty({ example: 1 })
  sports: number;

  @ApiProperty({ example: 2 })
  users: number;
}

export class SubscriptionStatusResponseDto {
  @ApiProperty({
    example: {
      code: 'PRO',
      name: 'Pro',
      priceMonthly: 99.0,
      currency: 'PEN',
    },
  })
  plan: {
    code: string;
    name: string;
    priceMonthly: number;
    currency: string;
  };

  @ApiProperty({ example: 'TRIALING', enum: ['TRIALING', 'ACTIVE', 'EXPIRED', 'CANCELED'] })
  status: string;

  @ApiProperty({ type: TrialInfoDto })
  trial: TrialInfoDto;

  @ApiProperty({ type: PlanLimitsDto })
  limits: PlanLimitsDto;

  @ApiProperty({ type: AcademyUsageDto })
  usage: AcademyUsageDto;

  @ApiProperty({ example: false })
  overLimit: boolean;

  @ApiProperty({
    example: {
      SUNAT_BILLING: true,
      WHATSAPP_AUTOMATION: true,
      ADVANCED_REPORTS: true,
    },
  })
  features: Record<string, boolean>;
}

export class UpgradeSubscriptionDto {
  @ApiProperty({ example: 'PRO', description: 'Código del plan a activar (PRO)' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['PRO'])
  planCode: string;
}

export class DowngradeSubscriptionDto {
  @ApiProperty({ example: 'FREE', description: 'Código del plan al que se regresa (FREE)' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['FREE'])
  planCode: string;
}
