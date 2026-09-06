import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      include: {
        features: {
          orderBy: { key: 'asc' },
        },
      },
      orderBy: { priceMonthly: 'asc' },
    });

    return plans.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      priceMonthly: Number(p.priceMonthly),
      currency: p.currency,
      maxStudents: p.maxStudents,
      maxGroups: p.maxGroups,
      maxSports: p.maxSports,
      maxUsers: p.maxUsers,
      features: p.features.map((f) => ({
        key: f.key,
        enabled: f.enabled,
        description: f.description,
        limitValue: f.limitValue,
      })),
    }));
  }

  async findByCode(code: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        features: true,
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${code}' no encontrado`);
    }

    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      priceMonthly: Number(plan.priceMonthly),
      currency: plan.currency,
      maxStudents: plan.maxStudents,
      maxGroups: plan.maxGroups,
      maxSports: plan.maxSports,
      maxUsers: plan.maxUsers,
      features: plan.features.map((f) => ({
        key: f.key,
        enabled: f.enabled,
        description: f.description,
        limitValue: f.limitValue,
      })),
    };
  }
}
