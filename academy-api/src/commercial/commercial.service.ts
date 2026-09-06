import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePackageDto, CreatePromotionDto } from './dto/commercial.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommercialService {
  private readonly logger = new Logger(CommercialService.name);

  constructor(private readonly prisma: PrismaService) {}

  // PACKAGES
  async getPackages(academyId: string) {
    const packages = await this.prisma.package.findMany({
      where: { academyId, isActive: true },
      include: {
        _count: {
          select: { credits: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return packages.map((p) => ({
      id: p.id,
      name: p.name,
      classCount: p.classCount,
      bonusClasses: p.bonusClasses,
      price: Number(p.price),
      validityDays: p.validityDays,
      soldCount: p._count.credits,
      isActive: p.isActive,
    }));
  }

  async createPackage(academyId: string, dto: CreatePackageDto) {
    return await this.prisma.package.create({
      data: {
        academyId,
        name: dto.name,
        classCount: dto.classCount,
        bonusClasses: dto.bonusClasses || 0,
        price: new Prisma.Decimal(dto.price),
        validityDays: dto.validityDays || 60,
        isActive: true,
      },
    });
  }

  // PROMOTIONS
  async getPromotions(academyId: string) {
    const promos = await this.prisma.promotion.findMany({
      where: { academyId },
      orderBy: { createdAt: 'desc' },
    });

    return promos.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description || '',
      discountPct: p.discountPct ? Number(p.discountPct) : undefined,
      discountFixed: p.discountFixed ? Number(p.discountFixed) : undefined,
      bonusClasses: p.bonusClasses || 0,
      startDate: p.startDate.toISOString().split('T')[0],
      endDate: p.endDate.toISOString().split('T')[0],
      isActive: p.isActive,
    }));
  }

  async createPromotion(academyId: string, dto: CreatePromotionDto) {
    return await this.prisma.promotion.create({
      data: {
        academyId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description || null,
        discountPct: dto.discountPct ? new Prisma.Decimal(dto.discountPct) : null,
        discountFixed: dto.discountFixed ? new Prisma.Decimal(dto.discountFixed) : null,
        bonusClasses: dto.bonusClasses || 0,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: true,
      },
    });
  }

  // TRIALS
  async getTrials(academyId: string) {
    const trials = await this.prisma.trial.findMany({
      where: {
        student: { academyId },
      },
      include: {
        student: {
          include: {
            family: { include: { contacts: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return trials.map((t) => ({
      id: t.id,
      studentId: t.studentId,
      studentName: `${t.student.firstName} ${t.student.lastName}`,
      phone: t.student.family?.contacts[0]?.phone || t.student.emergencyPhone || '',
      isPaid: t.isPaid,
      price: Number(t.price),
      converted: t.converted,
      convertedAt: t.convertedAt ? t.convertedAt.toISOString() : null,
      notes: t.notes || '',
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async convertTrial(academyId: string, trialId: string) {
    const trial = await this.prisma.trial.findUnique({
      where: { id: trialId },
      include: { student: true },
    });

    if (!trial || trial.student.academyId !== academyId) {
      throw new NotFoundException(`Trial ${trialId} no encontrado`);
    }

    return await this.prisma.trial.update({
      where: { id: trialId },
      data: {
        converted: true,
        convertedAt: new Date(),
      },
    });
  }
}
