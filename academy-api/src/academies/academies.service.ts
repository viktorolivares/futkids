import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAcademyDto } from './dto/create-academy.dto';
import { Role } from '@prisma/client';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class AcademiesService {
  private readonly logger = new Logger(AcademiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(dto: CreateAcademyDto, creatorUserId: string) {
    // Check if slug already exists
    const existing = await this.prisma.academy.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        code: 'SLUG_ALREADY_EXISTS',
        message: `El slug '${dto.slug}' ya está en uso por otra academia`,
      });
    }

    if (dto.ruc) {
      const existingRuc = await this.prisma.academy.findUnique({
        where: { ruc: dto.ruc },
      });
      if (existingRuc) {
        throw new ConflictException({
          statusCode: 409,
          code: 'RUC_ALREADY_EXISTS',
          message: `El RUC '${dto.ruc}' ya se encuentra registrado`,
        });
      }
    }

    // Create Academy + default OWNER membership in a transaction
    return await this.prisma.$transaction(async (tx) => {
      const academy = await tx.academy.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          legalName: dto.legalName,
          ruc: dto.ruc,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          city: dto.city || 'Lima',
        },
      });

      // Assign creator as OWNER
      await tx.membership.create({
        data: {
          academyId: academy.id,
          userId: creatorUserId,
          role: Role.OWNER,
          isDefault: true,
        },
      });

      // Create default policy
      await tx.academyPolicy.create({
        data: {
          academyId: academy.id,
          allowTrainingWithDebt: true,
          debtWarningThreshold: 50.0,
          cancellationPolicy: 'CREDIT',
          siblingDiscountPct: 10.0,
        },
      });

      // Automatically assign 14-day PRO trial subscription
      await this.subscriptionsService.createTrialSubscription(academy.id, tx);

      this.logger.log(`Academy created: ${academy.name} (${academy.id}) by user ${creatorUserId} with 14-day PRO trial`);
      return academy;
    });
  }

  async findMyAcademies(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        isActive: true,
        academy: { isActive: true },
      },
      include: {
        academy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      isDefault: m.isDefault,
      academy: m.academy,
    }));
  }

  async findById(academyId: string) {
    const academy = await this.prisma.academy.findUnique({
      where: { id: academyId },
      include: {
        policies: true,
        _count: {
          select: {
            students: true,
            sports: true,
            groups: true,
            memberships: true,
          },
        },
      },
    });

    if (!academy) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'ACADEMY_NOT_FOUND',
        message: 'La academia solicitada no existe',
      });
    }

    return academy;
  }
}
