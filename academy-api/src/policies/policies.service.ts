import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPolicy(academyId: string) {
    let policy = await this.prisma.academyPolicy.findFirst({
      where: { academyId },
    });

    if (!policy) {
      policy = await this.prisma.academyPolicy.create({
        data: {
          academyId,
          allowTrainingWithDebt: true,
          debtWarningThreshold: new Prisma.Decimal(50.0),
          cancellationPolicy: 'CREDIT',
          siblingDiscountPct: new Prisma.Decimal(10.0),
        },
      });
    }

    return {
      id: policy.id,
      academyId: policy.academyId,
      allowTrainingWithDebt: policy.allowTrainingWithDebt,
      debtWarningThreshold: Number(policy.debtWarningThreshold),
      cancellationPolicy: policy.cancellationPolicy,
      siblingDiscountPct: Number(policy.siblingDiscountPct),
      makeupClassesAllowed: true,
      gracePeriodDays: 5,
    };
  }

  async updatePolicy(academyId: string, data: any) {
    const policy = await this.getPolicy(academyId);

    const updateData: Prisma.AcademyPolicyUpdateInput = {};
    if (data.allowTrainingWithDebt !== undefined) updateData.allowTrainingWithDebt = data.allowTrainingWithDebt;
    if (data.debtWarningThreshold !== undefined) updateData.debtWarningThreshold = new Prisma.Decimal(data.debtWarningThreshold);
    if (data.cancellationPolicy !== undefined) updateData.cancellationPolicy = data.cancellationPolicy;
    if (data.siblingDiscountPct !== undefined) updateData.siblingDiscountPct = new Prisma.Decimal(data.siblingDiscountPct);

    await this.prisma.academyPolicy.update({
      where: { id: policy.id },
      data: updateData,
    });

    return this.getPolicy(academyId);
  }
}
