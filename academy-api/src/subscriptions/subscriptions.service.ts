import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SubscriptionStatus } from '@prisma/client';
import {
  DEFAULT_PLANS_SEED,
  PlanFeatureKey,
} from './constants/plan-features.constant';
import { SubscriptionStatusResponseDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedPlansIfNotExist();
  }

  /**
   * Asegura que los planes FREE y PRO existan en la base de datos con sus respectivas features.
   */
  async seedPlansIfNotExist(): Promise<void> {
    try {
      for (const planData of DEFAULT_PLANS_SEED) {
        const { features, ...planFields } = planData;

        const plan = await this.prisma.plan.upsert({
          where: { code: planFields.code },
          update: {
            name: planFields.name,
            description: planFields.description,
            priceMonthly: planFields.priceMonthly,
            currency: planFields.currency,
            maxStudents: planFields.maxStudents,
            maxGroups: planFields.maxGroups,
            maxSports: planFields.maxSports,
            maxUsers: planFields.maxUsers,
            isActive: true,
          },
          create: {
            code: planFields.code,
            name: planFields.name,
            description: planFields.description,
            priceMonthly: planFields.priceMonthly,
            currency: planFields.currency,
            maxStudents: planFields.maxStudents,
            maxGroups: planFields.maxGroups,
            maxSports: planFields.maxSports,
            maxUsers: planFields.maxUsers,
            isActive: true,
          },
        });

        // Upsert features for this plan
        for (const feat of features) {
          await this.prisma.planFeature.upsert({
            where: {
              planId_key: {
                planId: plan.id,
                key: feat.key,
              },
            },
            update: {
              enabled: feat.enabled,
              description: feat.description,
            },
            create: {
              planId: plan.id,
              key: feat.key,
              enabled: feat.enabled,
              description: feat.description,
            },
          });
        }
      }
      this.logger.log('SaaS Plans and Features seeded successfully (FREE & PRO).');
    } catch (error) {
      this.logger.error(`Failed to seed plans: ${error.message}`, error.stack);
    }
  }

  /**
   * Crea una suscripción con 14 días de prueba PRO para una nueva academia
   */
  async createTrialSubscription(academyId: string, txPrisma?: any) {
    const db = txPrisma || this.prisma;

    // Buscar el plan PRO
    let proPlan = await db.plan.findUnique({ where: { code: 'PRO' } });
    if (!proPlan) {
      await this.seedPlansIfNotExist();
      proPlan = await db.plan.findUnique({ where: { code: 'PRO' } });
    }

    if (!proPlan) {
      throw new NotFoundException('Plan PRO no encontrado en la base de datos');
    }

    const now = new Date();
    const trialDays = 14;
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const subscription = await db.subscription.create({
      data: {
        academyId,
        planId: proPlan.id,
        status: SubscriptionStatus.TRIALING,
        trialStartsAt: now,
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
      },
      include: {
        plan: {
          include: { features: true },
        },
      },
    });

    // Registrar en AuditLog
    await db.auditLog.create({
      data: {
        academyId,
        action: 'TRIAL_STARTED',
        entity: 'Subscription',
        entityId: subscription.id,
        newValue: {
          plan: 'PRO',
          status: 'TRIALING',
          trialStartsAt: now.toISOString(),
          trialEndsAt: trialEndsAt.toISOString(),
          trialDays,
        },
      },
    });

    this.logger.log(`Created 14-day PRO trial subscription for Academy: ${academyId}`);
    return subscription;
  }

  /**
   * Obtiene la suscripción efectiva de la academia, auto-evaluando si el periodo de prueba expiró
   */
  async getEffectiveSubscription(academyId: string) {
    let subscription = await this.prisma.subscription.findUnique({
      where: { academyId },
      include: {
        plan: {
          include: { features: true },
        },
      },
    });

    // Si no tiene suscripción aún (academias pre-existentes), asignarle FREE o Trial
    if (!subscription) {
      const freePlan = await this.prisma.plan.findUnique({
        where: { code: 'FREE' },
        include: { features: true },
      });
      if (!freePlan) {
        await this.seedPlansIfNotExist();
      }
      const plan = await this.prisma.plan.findUnique({
        where: { code: 'FREE' },
        include: { features: true },
      });

      subscription = await this.prisma.subscription.create({
        data: {
          academyId,
          planId: plan!.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
        },
        include: {
          plan: {
            include: { features: true },
          },
        },
      });
    }

    // Comprobar expiración del TRIAL
    if (subscription.status === SubscriptionStatus.TRIALING) {
      const now = new Date();
      if (subscription.trialEndsAt && now >= subscription.trialEndsAt) {
        // El trial ha expirado -> Downgrade automático a FREE
        this.logger.warn(`Trial expired for Academy ${academyId}. Auto-downgrading to FREE plan.`);

        const freePlan = await this.prisma.plan.findUnique({
          where: { code: 'FREE' },
          include: { features: true },
        });

        if (freePlan) {
          subscription = await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              planId: freePlan.id,
              status: SubscriptionStatus.EXPIRED,
              currentPeriodEnd: null,
            },
            include: {
              plan: {
                include: { features: true },
              },
            },
          });

          // Registrar en auditoría
          await this.prisma.auditLog.create({
            data: {
              academyId,
              action: 'TRIAL_EXPIRED',
              entity: 'Subscription',
              entityId: subscription.id,
              newValue: {
                previousPlan: 'PRO',
                newPlan: 'FREE',
                status: 'EXPIRED',
                reason: '14_DAYS_TRIAL_PERIOD_ENDED',
              },
            },
          });
        }
      }
    }

    return subscription;
  }

  /**
   * Verifica si una funcionalidad está habilitada para la academia
   */
  async hasFeature(academyId: string, featureKey: PlanFeatureKey | string): Promise<boolean> {
    const subscription = await this.getEffectiveSubscription(academyId);
    if (!subscription || !subscription.plan) {
      return false;
    }

    const feature = subscription.plan.features.find((f) => f.key === featureKey);
    return feature ? feature.enabled : false;
  }

  /**
   * Obtiene el plan actual con límites
   */
  async getCurrentPlan(academyId: string) {
    const subscription = await this.getEffectiveSubscription(academyId);
    return subscription.plan;
  }

  /**
   * Retorna el estado completo de suscripción, trial, límites y métricas de uso actuales
   */
  async getSubscriptionStatusWithUsage(academyId: string): Promise<SubscriptionStatusResponseDto> {
    const subscription = await this.getEffectiveSubscription(academyId);
    const plan = subscription.plan;

    // Calcular métricas de uso reales en base a la base de datos
    const [studentsCount, groupsCount, sportsCount, usersCount] = await Promise.all([
      this.prisma.student.count({
        where: { academyId, isActive: true },
      }),
      this.prisma.group.count({
        where: { academyId, isActive: true },
      }),
      this.prisma.sport.count({
        where: { academyId, isActive: true },
      }),
      this.prisma.membership.count({
        where: { academyId, isActive: true },
      }),
    ]);

    // Calcular días restantes de prueba
    const now = new Date();
    const isTrialActive =
      subscription.status === SubscriptionStatus.TRIALING &&
      subscription.trialEndsAt !== null &&
      now < subscription.trialEndsAt;

    let remainingDays = 0;
    if (isTrialActive && subscription.trialEndsAt) {
      const diffMs = subscription.trialEndsAt.getTime() - now.getTime();
      remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Verificar si está excediendo límites (por ejemplo si bajó de PRO a FREE con más de 30 alumnos)
    const overStudents = plan.maxStudents !== null && studentsCount > plan.maxStudents;
    const overGroups = plan.maxGroups !== null && groupsCount > plan.maxGroups;
    const overSports = plan.maxSports !== null && sportsCount > plan.maxSports;
    const overUsers = plan.maxUsers !== null && usersCount > plan.maxUsers;
    const overLimit = overStudents || overGroups || overSports || overUsers;

    // Mapa de features
    const featuresMap: Record<string, boolean> = {};
    for (const f of plan.features) {
      featuresMap[f.key] = f.enabled;
    }

    return {
      plan: {
        code: plan.code,
        name: plan.name,
        priceMonthly: Number(plan.priceMonthly),
        currency: plan.currency,
      },
      status: subscription.status,
      trial: {
        active: isTrialActive,
        startsAt: subscription.trialStartsAt ? subscription.trialStartsAt.toISOString() : null,
        endsAt: subscription.trialEndsAt ? subscription.trialEndsAt.toISOString() : null,
        remainingDays,
      },
      limits: {
        students: plan.maxStudents,
        groups: plan.maxGroups,
        sports: plan.maxSports,
        users: plan.maxUsers,
      },
      usage: {
        students: studentsCount,
        groups: groupsCount,
        sports: sportsCount,
        users: usersCount,
      },
      overLimit,
      features: featuresMap,
    };
  }

  /**
   * Actualiza / mejora la suscripción de la academia a PRO
   */
  async upgradeToPlan(academyId: string, planCode: string) {
    const targetPlan = await this.prisma.plan.findUnique({
      where: { code: planCode },
      include: { features: true },
    });

    if (!targetPlan) {
      throw new NotFoundException(`Plan ${planCode} no encontrado`);
    }

    const currentSub = await this.getEffectiveSubscription(academyId);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days period

    const updated = await this.prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        planId: targetPlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: {
        plan: { include: { features: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        academyId,
        action: 'PLAN_UPGRADED',
        entity: 'Subscription',
        entityId: updated.id,
        oldValue: { plan: currentSub.plan.code, status: currentSub.status },
        newValue: { plan: targetPlan.code, status: SubscriptionStatus.ACTIVE },
      },
    });

    this.logger.log(`Academy ${academyId} upgraded to plan ${planCode}`);
    return this.getSubscriptionStatusWithUsage(academyId);
  }

  /**
   * Cambia o degrada la academia al plan FREE sin borrar ningún dato histórico
   */
  async downgradeToFree(academyId: string) {
    const freePlan = await this.prisma.plan.findUnique({
      where: { code: 'FREE' },
      include: { features: true },
    });

    if (!freePlan) {
      throw new NotFoundException('Plan FREE no encontrado');
    }

    const currentSub = await this.getEffectiveSubscription(academyId);

    const updated = await this.prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: null,
      },
      include: {
        plan: { include: { features: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        academyId,
        action: 'PLAN_DOWNGRADED',
        entity: 'Subscription',
        entityId: updated.id,
        oldValue: { plan: currentSub.plan.code, status: currentSub.status },
        newValue: { plan: 'FREE', status: SubscriptionStatus.ACTIVE },
      },
    });

    this.logger.log(`Academy ${academyId} downgraded to plan FREE. All historical data preserved.`);
    return this.getSubscriptionStatusWithUsage(academyId);
  }

  /**
   * Proceso por lotes para el worker de BullMQ: Expira pruebas que hayan superado los 14 días
   */
  async expireTrials(): Promise<{ expiredCount: number; affectedAcademies: string[] }> {
    const now = new Date();
    const expiredTrials = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: {
          lte: now,
        },
      },
      include: {
        academy: { select: { id: true, name: true } },
      },
    });

    if (!expiredTrials.length) {
      return { expiredCount: 0, affectedAcademies: [] };
    }

    const freePlan = await this.prisma.plan.findUnique({ where: { code: 'FREE' } });
    if (!freePlan) {
      await this.seedPlansIfNotExist();
    }
    const resolvedFreePlan = await this.prisma.plan.findUnique({ where: { code: 'FREE' } });

    const affectedAcademies: string[] = [];

    for (const sub of expiredTrials) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: resolvedFreePlan!.id,
          status: SubscriptionStatus.EXPIRED,
          currentPeriodEnd: null,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          academyId: sub.academyId,
          action: 'TRIAL_EXPIRED',
          entity: 'Subscription',
          entityId: sub.id,
          newValue: {
            previousPlan: 'PRO',
            newPlan: 'FREE',
            status: 'EXPIRED',
            executedBy: 'BULLMQ_JOB_SUBSCRIPTION_EXPIRE_TRIALS',
          },
        },
      });

      affectedAcademies.push(sub.academyId);
      this.logger.log(`Expired trial for academy ${sub.academy.name} (${sub.academyId}) -> Downgraded to FREE`);
    }

    return {
      expiredCount: affectedAcademies.length,
      affectedAcademies,
    };
  }
}
