import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SubscriptionsService } from './subscriptions.service';
import { PlanLimitException } from './exceptions/plan-limit.exception';
import { FeatureNotAvailableException } from './exceptions/feature-not-available.exception';
import { PlanFeatureKey } from './constants/plan-features.constant';

@Injectable()
export class PlanLimitService {
  private readonly logger = new Logger(PlanLimitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Valida si la academia puede registrar un nuevo alumno sin superar el límite de su plan
   */
  async assertCanAddStudent(academyId: string): Promise<void> {
    const plan = await this.subscriptionsService.getCurrentPlan(academyId);

    // Si el límite es nulo, el plan permite alumnos ilimitados (Plan PRO)
    if (plan.maxStudents === null) {
      return;
    }

    const currentCount = await this.prisma.student.count({
      where: {
        academyId,
        isActive: true,
      },
    });

    if (currentCount >= plan.maxStudents) {
      throw new PlanLimitException({
        feature: 'MAX_STUDENTS',
        current: currentCount,
        limit: plan.maxStudents,
        customMessage: `Has alcanzado el límite de alumnos de tu plan gratuito (${plan.maxStudents} alumnos activos). Actualiza a Pro para registrar alumnos ilimitados.`,
      });
    }
  }

  /**
   * Valida si la academia puede crear un nuevo grupo/categoría
   */
  async assertCanAddGroup(academyId: string): Promise<void> {
    const plan = await this.subscriptionsService.getCurrentPlan(academyId);

    if (plan.maxGroups === null) {
      return;
    }

    const currentCount = await this.prisma.group.count({
      where: {
        academyId,
        isActive: true,
      },
    });

    if (currentCount >= plan.maxGroups) {
      throw new PlanLimitException({
        feature: 'MAX_GROUPS',
        current: currentCount,
        limit: plan.maxGroups,
        customMessage: `Has alcanzado el límite de grupos de tu plan gratuito (${plan.maxGroups} grupos activos). Actualiza a Pro para crear más grupos.`,
      });
    }
  }

  /**
   * Valida si la academia puede crear una nueva disciplina deportiva
   */
  async assertCanAddSport(academyId: string): Promise<void> {
    const plan = await this.subscriptionsService.getCurrentPlan(academyId);

    if (plan.maxSports === null) {
      return;
    }

    const currentCount = await this.prisma.sport.count({
      where: {
        academyId,
        isActive: true,
      },
    });

    if (currentCount >= plan.maxSports) {
      throw new PlanLimitException({
        feature: 'MAX_SPORTS',
        current: currentCount,
        limit: plan.maxSports,
        customMessage: `Has alcanzado el límite de disciplinas de tu plan gratuito (${plan.maxSports} deporte). Actualiza a Pro para gestionar multideporte.`,
      });
    }
  }

  /**
   * Valida si la academia puede invitar / registrar un nuevo usuario en su staff
   */
  async assertCanAddUser(academyId: string): Promise<void> {
    const plan = await this.subscriptionsService.getCurrentPlan(academyId);

    if (plan.maxUsers === null) {
      return;
    }

    const currentCount = await this.prisma.membership.count({
      where: {
        academyId,
        isActive: true,
      },
    });

    if (currentCount >= plan.maxUsers) {
      throw new PlanLimitException({
        feature: 'MAX_USERS',
        current: currentCount,
        limit: plan.maxUsers,
        customMessage: `Has alcanzado el límite de usuarios de tu plan (${plan.maxUsers} usuarios). Actualiza a Pro para añadir más miembros de equipo.`,
      });
    }
  }

  /**
   * Valida que una funcionalidad específica esté habilitada en el plan activo
   */
  async assertHasFeature(academyId: string, featureKey: PlanFeatureKey | string): Promise<void> {
    const isEnabled = await this.subscriptionsService.hasFeature(academyId, featureKey);
    if (!isEnabled) {
      throw new FeatureNotAvailableException(
        featureKey,
        `La funcionalidad '${featureKey}' está reservada para el plan Pro. Actualiza tu suscripción para desbloquearla.`,
      );
    }
  }
}
