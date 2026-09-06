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
    let finalSlug = (dto.slug || dto.name)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!finalSlug) {
      finalSlug = `acad-${Date.now()}`;
    }

    const existing = await this.prisma.academy.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      finalSlug = `${finalSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Create Academy + default OWNER membership in a transaction
    return await this.prisma.$transaction(async (tx) => {
      const academy = await tx.academy.create({
        data: {
          name: dto.name,
          slug: finalSlug,
          legalName: dto.legalName || dto.name,
          ruc: dto.ruc,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          city: dto.city || 'Lima',
        },
      });

      // Assign creator as OWNER if user exists
      if (creatorUserId) {
        await tx.membership.create({
          data: {
            academyId: academy.id,
            userId: creatorUserId,
            role: Role.OWNER,
            isDefault: false,
          },
        });
      }

      // Create default SUNAT billing settings
      await tx.billingSetting.create({
        data: {
          academyId: academy.id,
          ruc: dto.ruc || '20123456789',
          solUser: 'MODDATOS',
          solPassword: 'moddatos',
          environment: 'BETA',
          boletaSeries: 'B001',
          facturaSeries: 'F001',
          notaCreditoSeries: 'NC01',
          notaDebitoSeries: 'ND01',
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

      this.logger.log(`Academy created: ${academy.name} (${academy.id}) with 14-day PRO trial`);
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

  async findAll() {
    const academies = await this.prisma.academy.findMany({
      where: { isActive: true },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        billingSettings: true,
        _count: {
          select: {
            students: true,
            sports: true,
            groups: true,
            memberships: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return academies.map((a) => {
      const sub = a.subscription;
      const planCode = (sub?.plan?.code || 'PRO') as 'FREE' | 'PRO' | 'ENTERPRISE';
      const mrr = sub?.plan?.priceMonthly ? Number(sub.plan.priceMonthly) : 99.0;

      let trialDaysLeft = 0;
      if (sub?.trialEndsAt) {
        const msLeft = sub.trialEndsAt.getTime() - Date.now();
        trialDaysLeft = Math.max(0, Math.ceil(msLeft / (24 * 3600 * 1000)));
      }

      return {
        id: a.id,
        slug: a.slug,
        name: a.name,
        legalName: a.legalName || a.name,
        ruc: a.ruc || '',
        address: a.address || '',
        city: a.city || 'Lima',
        department: a.city || 'Lima',
        phone: a.phone || '',
        email: a.email || '',
        contactPerson: 'Director de Sede',
        plan: planCode,
        planStatus: (sub?.status || 'ACTIVE') as any,
        trialDaysLeft,
        trialEndsAt: sub?.trialEndsAt ? sub.trialEndsAt.toISOString() : null,
        mrr,
        studentsCount: a._count.students,
        studentsLimit: sub?.plan?.maxStudents || null,
        sportsCount: a._count.sports,
        groupsCount: a._count.groups,
        staffCount: a._count.memberships,
        invoicesThisMonth: a._count.invoices,
        sunatStatus: a.billingSettings?.environment === 'PRODUCTION' ? 'CONFIGURED_PROD' : 'CONFIGURED_BETA',
        certificateExpiresAt: '2028-12-31',
        apiKey: `sk_live_${a.slug}_${a.id.slice(0, 8)}`,
        createdAt: a.createdAt.toISOString(),
        lastActiveAt: 'En línea',
        isSuspended: false,
      };
    });
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

  // ==========================================
  // GESTIÓN DE PERSONAL Y SEDES (STAFF & MEMBERSHIPS)
  // ==========================================
  async getStaff(academyId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { academyId, isActive: true },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      id: m.user.id,
      name: `${m.user.firstName} ${m.user.lastName}`.trim(),
      email: m.user.email,
      phone: m.user.phone || '',
      dni: m.user.documentNumber || '',
      role: m.role,
      roleTitle:
        m.role === 'OWNER'
          ? 'Director General / Fundador'
          : m.role === 'ADMIN'
          ? 'Administrador de Sede'
          : m.role === 'COACH'
          ? 'Entrenador Deportivo'
          : m.role === 'CASHIER'
          ? 'Cajero / Cobranzas'
          : 'Personal de Apoyo',
      sports: ['Fútbol Formativo'],
      joinedDate: m.createdAt.toISOString().split('T')[0],
      status: m.isActive ? 'ACTIVE' : 'INACTIVE',
      monthlySalary: m.role === 'OWNER' ? 4500 : m.role === 'COACH' ? 2800 : m.role === 'CASHIER' ? 2200 : 1900,
    }));
  }

  async addStaff(
    academyId: string,
    dto: { email: string; firstName?: string; lastName?: string; role: Role; phone?: string; dni?: string }
  ) {
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Create user if not exists
      const bcrypt = await import('bcrypt');
      const defaultHash = await bcrypt.hash('Admin123!', 10);
      user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash: defaultHash,
          firstName: dto.firstName || 'Colaborador',
          lastName: dto.lastName || 'Sede',
          documentNumber: dto.dni || null,
          phone: dto.phone || null,
          isActive: true,
        },
      });
    }

    // Check if membership already exists
    const existingMembership = await this.prisma.membership.findFirst({
      where: { academyId, userId: user.id },
    });

    if (existingMembership) {
      // Update role
      return await this.prisma.membership.update({
        where: { id: existingMembership.id },
        data: { role: dto.role, isActive: true },
        include: { user: true },
      });
    }

    return await this.prisma.membership.create({
      data: {
        academyId,
        userId: user.id,
        role: dto.role,
        isActive: true,
        isDefault: false,
      },
      include: { user: true },
    });
  }

  async removeStaff(academyId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, academyId },
    });

    if (!membership) {
      throw new NotFoundException('Membresía no encontrada');
    }

    return await this.prisma.membership.update({
      where: { id: membershipId },
      data: { isActive: false },
    });
  }

  // ==========================================
  // CONFIGURACIÓN FISCAL Y SUNAT POR SEDE
  // ==========================================
  async getBillingConfig(academyId: string) {
    let config = await this.prisma.billingSetting.findUnique({
      where: { academyId },
    });

    const academy = await this.prisma.academy.findUnique({
      where: { id: academyId },
    });

    if (!config) {
      config = await this.prisma.billingSetting.create({
        data: {
          academyId,
          ruc: academy?.ruc || '20123456789',
          solUser: 'MODDATOS',
          solPassword: 'moddatos',
          environment: 'BETA',
          boletaSeries: 'B001',
          facturaSeries: 'F001',
          notaCreditoSeries: 'NC01',
          notaDebitoSeries: 'ND01',
        },
      });
    }

    return {
      id: config.id,
      academyId: config.academyId,
      academyName: academy?.name || 'Academia Deportiva',
      legalName: academy?.legalName || academy?.name,
      ruc: config.ruc || academy?.ruc || '20123456789',
      address: academy?.address || 'Av. Javier Prado Este 2500',
      establishmentCode: '0000',
      environment: config.environment,
      boletaSeries: config.boletaSeries,
      facturaSeries: config.facturaSeries,
      notaCreditoSeries: config.notaCreditoSeries,
      solUser: config.solUser,
      certificateStatus: 'VALID',
      certificateExpiresAt: '2028-12-31',
    };
  }

  async updateBillingConfig(academyId: string, dto: any) {
    await this.prisma.billingSetting.upsert({
      where: { academyId },
      create: {
        academyId,
        ruc: dto.ruc,
        solUser: dto.solUser || 'MODDATOS',
        solPassword: dto.solPassword || 'moddatos',
        environment: dto.environment || 'BETA',
        boletaSeries: dto.boletaSeries || 'B001',
        facturaSeries: dto.facturaSeries || 'F001',
        notaCreditoSeries: dto.notaCreditoSeries || 'NC01',
      },
      update: {
        ruc: dto.ruc,
        solUser: dto.solUser,
        solPassword: dto.solPassword,
        environment: dto.environment,
        boletaSeries: dto.boletaSeries,
        facturaSeries: dto.facturaSeries,
        notaCreditoSeries: dto.notaCreditoSeries,
      },
    });

    if (dto.name || dto.legalName || dto.ruc || dto.address) {
      await this.prisma.academy.update({
        where: { id: academyId },
        data: {
          name: dto.name,
          legalName: dto.legalName,
          ruc: dto.ruc,
          address: dto.address,
        },
      });
    }

    return await this.getBillingConfig(academyId);
  }
}
