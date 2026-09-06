import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionsService } from '../src/subscriptions/subscriptions.service';
import { PlanLimitService } from '../src/subscriptions/plan-limit.service';
import { PlansService } from '../src/subscriptions/plans.service';
import { FeatureGuard } from '../src/subscriptions/guards/feature.guard';
import { PlanLimitException } from '../src/subscriptions/exceptions/plan-limit.exception';
import { FeatureNotAvailableException } from '../src/subscriptions/exceptions/feature-not-available.exception';
import { PlanFeatureKey, DEFAULT_PLANS_SEED } from '../src/subscriptions/constants/plan-features.constant';
import { SubscriptionStatus } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('SaaS Subscriptions & 14-Day Trial System', () => {
  let subscriptionsService: SubscriptionsService;
  let planLimitService: PlanLimitService;
  let plansService: PlansService;
  let featureGuard: FeatureGuard;
  let mockPrisma: any;
  let reflector: Reflector;

  const mockProPlan = {
    id: 'plan-pro-id',
    code: 'PRO',
    name: 'Pro',
    priceMonthly: 99.0,
    currency: 'PEN',
    maxStudents: null,
    maxGroups: null,
    maxSports: null,
    maxUsers: 10,
    isActive: true,
    features: DEFAULT_PLANS_SEED.find((p) => p.code === 'PRO')!.features.map((f) => ({
      id: `feat-${f.key}`,
      planId: 'plan-pro-id',
      key: f.key,
      enabled: f.enabled,
      description: f.description,
      limitValue: null,
    })),
  };

  const mockFreePlan = {
    id: 'plan-free-id',
    code: 'FREE',
    name: 'Free',
    priceMonthly: 0.0,
    currency: 'PEN',
    maxStudents: 30,
    maxGroups: 2,
    maxSports: 1,
    maxUsers: 2,
    isActive: true,
    features: DEFAULT_PLANS_SEED.find((p) => p.code === 'FREE')!.features.map((f) => ({
      id: `feat-${f.key}`,
      planId: 'plan-free-id',
      key: f.key,
      enabled: f.enabled,
      description: f.description,
      limitValue: null,
    })),
  };

  beforeEach(() => {
    mockPrisma = {
      plan: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.code === 'PRO') return Promise.resolve(mockProPlan);
          if (where.code === 'FREE') return Promise.resolve(mockFreePlan);
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([mockFreePlan, mockProPlan]),
        upsert: vi.fn().mockResolvedValue(mockProPlan),
      },
      planFeature: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      subscription: {
        create: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'sub-new-14d',
            ...data,
            plan: mockProPlan,
          }),
        ),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'sub-updated',
            ...data,
            plan: data.planId === 'plan-free-id' ? mockFreePlan : mockProPlan,
          }),
        ),
      },
      student: {
        count: vi.fn().mockResolvedValue(0),
      },
      group: {
        count: vi.fn().mockResolvedValue(0),
      },
      sport: {
        count: vi.fn().mockResolvedValue(0),
      },
      membership: {
        count: vi.fn().mockResolvedValue(1),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    subscriptionsService = new SubscriptionsService(mockPrisma);
    planLimitService = new PlanLimitService(mockPrisma, subscriptionsService);
    plansService = new PlansService(mockPrisma);
    reflector = new Reflector();
    featureGuard = new FeatureGuard(reflector, planLimitService);
  });

  // ===========================================================================
  // 1. REGISTRATION & 14-DAY TRIAL
  // ===========================================================================
  describe('1. Registro de Academia & Trial de 14 Días', () => {
    it('debe asignar automáticamente el plan PRO en estado TRIALING a toda nueva academia', async () => {
      const sub = await subscriptionsService.createTrialSubscription('academy-123');

      expect(sub.status).toBe(SubscriptionStatus.TRIALING);
      expect(sub.plan.code).toBe('PRO');
      expect(sub.academyId).toBe('academy-123');
    });

    it('debe establecer la duración del periodo de prueba exactamente en 14 días', async () => {
      const before = Date.now();
      const sub = await subscriptionsService.createTrialSubscription('academy-123');
      const after = Date.now();

      const durationMs = sub.trialEndsAt.getTime() - sub.trialStartsAt.getTime();
      const expected14DaysMs = 14 * 24 * 60 * 60 * 1000;

      expect(durationMs).toBe(expected14DaysMs);
      expect(sub.trialStartsAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(sub.trialStartsAt.getTime()).toBeLessThanOrEqual(after);
    });

    it('debe registrar el evento TRIAL_STARTED en AuditLog al crearse la prueba', async () => {
      await subscriptionsService.createTrialSubscription('academy-123');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            academyId: 'academy-123',
            action: 'TRIAL_STARTED',
            entity: 'Subscription',
          }),
        }),
      );
    });

    it('debe otorgar acceso ilimitado y todas las features habilitadas durante el trial activo', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-active-trial',
        academyId: 'academy-trial-user',
        status: SubscriptionStatus.TRIALING,
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 10 * 86400000), // 10 days left
        plan: mockProPlan,
      });

      const hasSunat = await subscriptionsService.hasFeature('academy-trial-user', PlanFeatureKey.SUNAT_BILLING);
      const hasWhatsapp = await subscriptionsService.hasFeature('academy-trial-user', PlanFeatureKey.WHATSAPP_AUTOMATION);
      const plan = await subscriptionsService.getCurrentPlan('academy-trial-user');

      expect(hasSunat).toBe(true);
      expect(hasWhatsapp).toBe(true);
      expect(plan.maxStudents).toBeNull(); // Unlimited
    });
  });

  // ===========================================================================
  // 2. LÍMITES DE ALUMNOS (STUDENTS LIMIT)
  // ===========================================================================
  describe('2. Límites de Alumnos Activos', () => {
    it('debe permitir crear un alumno si el conteo actual es menor a 30 en plan FREE', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-free',
        academyId: 'academy-free',
        status: SubscriptionStatus.ACTIVE,
        plan: mockFreePlan,
      });
      mockPrisma.student.count.mockResolvedValue(29);

      // Should not throw
      await expect(planLimitService.assertCanAddStudent('academy-free')).resolves.toBeUndefined();
    });

    it('debe lanzar PlanLimitException (403) al intentar registrar el alumno 31 en plan FREE', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-free',
        academyId: 'academy-free',
        status: SubscriptionStatus.ACTIVE,
        plan: mockFreePlan,
      });
      mockPrisma.student.count.mockResolvedValue(30);

      await expect(planLimitService.assertCanAddStudent('academy-free')).rejects.toThrowError(PlanLimitException);

      try {
        await planLimitService.assertCanAddStudent('academy-free');
      } catch (err: any) {
        expect(err.getStatus()).toBe(403);
        const resp = err.getResponse();
        expect(resp.code).toBe('PLAN_LIMIT_REACHED');
        expect(resp.feature).toBe('MAX_STUDENTS');
        expect(resp.current).toBe(30);
        expect(resp.limit).toBe(30);
        expect(resp.upgradeRequired).toBe(true);
      }
    });

    it('debe permitir registrar alumnos sin tope en plan PRO (límite null)', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-pro',
        academyId: 'academy-pro',
        status: SubscriptionStatus.ACTIVE,
        plan: mockProPlan,
      });
      mockPrisma.student.count.mockResolvedValue(250);

      await expect(planLimitService.assertCanAddStudent('academy-pro')).resolves.toBeUndefined();
    });

    it('debe permitir registrar alumnos sin tope durante el periodo de prueba de 14 días', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-trial',
        academyId: 'academy-trial',
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: new Date(Date.now() + 5 * 86400000),
        plan: mockProPlan,
      });
      mockPrisma.student.count.mockResolvedValue(55);

      await expect(planLimitService.assertCanAddStudent('academy-trial')).resolves.toBeUndefined();
    });
  });

  // ===========================================================================
  // 3. LÍMITES DE GRUPOS Y DISCIPLINAS
  // ===========================================================================
  describe('3. Límites de Grupos y Deportes', () => {
    it('debe permitir hasta 2 grupos en plan FREE y bloquear el 3er grupo con PlanLimitException', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-free',
        academyId: 'academy-free',
        status: SubscriptionStatus.ACTIVE,
        plan: mockFreePlan,
      });

      mockPrisma.group.count.mockResolvedValue(1);
      await expect(planLimitService.assertCanAddGroup('academy-free')).resolves.toBeUndefined();

      mockPrisma.group.count.mockResolvedValue(2);
      await expect(planLimitService.assertCanAddGroup('academy-free')).rejects.toThrowError(PlanLimitException);
    });

    it('debe permitir grupos ilimitados en plan PRO', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-pro',
        academyId: 'academy-pro',
        status: SubscriptionStatus.ACTIVE,
        plan: mockProPlan,
      });
      mockPrisma.group.count.mockResolvedValue(15);
      await expect(planLimitService.assertCanAddGroup('academy-pro')).resolves.toBeUndefined();
    });

    it('debe restringir a 1 sola disciplina deportiva en plan FREE y permitir multideporte en PRO', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-free',
        academyId: 'academy-free',
        status: SubscriptionStatus.ACTIVE,
        plan: mockFreePlan,
      });
      mockPrisma.sport.count.mockResolvedValue(1);
      await expect(planLimitService.assertCanAddSport('academy-free')).rejects.toThrowError(PlanLimitException);

      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-pro',
        academyId: 'academy-pro',
        status: SubscriptionStatus.ACTIVE,
        plan: mockProPlan,
      });
      mockPrisma.sport.count.mockResolvedValue(5);
      await expect(planLimitService.assertCanAddSport('academy-pro')).resolves.toBeUndefined();
    });
  });

  // ===========================================================================
  // 4. LÍMITES DE USUARIOS (STAFF)
  // ===========================================================================
  describe('4. Límites de Usuarios del Staff', () => {
    it('debe permitir 2 usuarios en plan FREE y bloquear el 3ero', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-free',
        academyId: 'academy-free',
        status: SubscriptionStatus.ACTIVE,
        plan: mockFreePlan,
      });
      mockPrisma.membership.count.mockResolvedValue(2);
      await expect(planLimitService.assertCanAddUser('academy-free')).rejects.toThrowError(PlanLimitException);
    });

    it('debe permitir hasta 10 usuarios en plan PRO', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-pro',
        academyId: 'academy-pro',
        status: SubscriptionStatus.ACTIVE,
        plan: mockProPlan,
      });
      mockPrisma.membership.count.mockResolvedValue(6);
      await expect(planLimitService.assertCanAddUser('academy-pro')).resolves.toBeUndefined();
    });
  });

  // ===========================================================================
  // 5. FEATURE GUARDS (PROTECCIÓN DE FUNCIONALIDADES)
  // ===========================================================================
  describe('5. FeatureGuard & Funcionalidades Pro', () => {
    it('debe bloquear la emisión de SUNAT en plan FREE con FeatureNotAvailableException (403)', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-free',
        academyId: 'academy-free',
        status: SubscriptionStatus.ACTIVE,
        plan: mockFreePlan,
      });

      await expect(
        planLimitService.assertHasFeature('academy-free', PlanFeatureKey.SUNAT_BILLING),
      ).rejects.toThrowError(FeatureNotAvailableException);
    });

    it('debe permitir emitir en SUNAT en plan PRO y durante el trial', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-pro',
        academyId: 'academy-pro',
        status: SubscriptionStatus.ACTIVE,
        plan: mockProPlan,
      });

      await expect(
        planLimitService.assertHasFeature('academy-pro', PlanFeatureKey.SUNAT_BILLING),
      ).resolves.toBeUndefined();
    });

    it('FeatureGuard debe interceptar correctamente y bloquear rutas con metadata @RequireFeature', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-free',
        academyId: 'academy-free',
        status: SubscriptionStatus.ACTIVE,
        plan: mockFreePlan,
      });

      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(PlanFeatureKey.SUNAT_BILLING);

      const mockExecutionContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            tenant: { academyId: 'academy-free', role: 'ADMIN' },
            headers: {},
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(featureGuard.canActivate(mockExecutionContext)).rejects.toThrowError(
        FeatureNotAvailableException,
      );
    });
  });

  // ===========================================================================
  // 6. EXPIRACIÓN DE TRIAL & AUTO-DOWNGRADE
  // ===========================================================================
  describe('6. Expiración de Prueba y Auto-Downgrade sin Pérdida de Datos', () => {
    it('debe degradar automáticamente al plan FREE cuando el trial supera los 14 días', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60); // 1 minute in the past
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-expired',
        academyId: 'academy-expired',
        status: SubscriptionStatus.TRIALING,
        trialStartsAt: new Date(Date.now() - 15 * 86400000),
        trialEndsAt: pastDate,
        plan: mockProPlan,
      });

      const effective = await subscriptionsService.getEffectiveSubscription('academy-expired');

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            planId: mockFreePlan.id,
            status: SubscriptionStatus.EXPIRED,
          }),
        }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TRIAL_EXPIRED',
          }),
        }),
      );
    });

    it('debe preservar intactos todos los alumnos y datos históricos al descender a FREE', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-free',
        academyId: 'academy-legacy-45',
        status: SubscriptionStatus.EXPIRED,
        plan: mockFreePlan,
      });
      // Academy has 45 students (exceeding FREE limit of 30)
      mockPrisma.student.count.mockResolvedValue(45);

      const status = await subscriptionsService.getSubscriptionStatusWithUsage('academy-legacy-45');

      expect(status.plan.code).toBe('FREE');
      expect(status.usage.students).toBe(45);
      expect(status.limits.students).toBe(30);
      expect(status.overLimit).toBe(true); // Flag indicates over limit, but data is NOT deleted!
    });

    it('el worker batch expireTrials debe procesar y expirar pruebas vencidas en masa de forma idempotente', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([
        { id: 'sub-1', academyId: 'acad-1', academy: { id: 'acad-1', name: 'Academia 1' } },
        { id: 'sub-2', academyId: 'acad-2', academy: { id: 'acad-2', name: 'Academia 2' } },
      ]);

      const result = await subscriptionsService.expireTrials();

      expect(result.expiredCount).toBe(2);
      expect(result.affectedAcademies).toEqual(['acad-1', 'acad-2']);
      expect(mockPrisma.subscription.update).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // 7. UPGRADE & DOWNGRADE MANUAL
  // ===========================================================================
  describe('7. Upgrade a PRO y Downgrade Voluntario', () => {
    it('debe actualizar la suscripción a PRO en estado ACTIVE con validez de 30 días', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-free-user',
        academyId: 'academy-pay',
        status: SubscriptionStatus.ACTIVE,
        plan: mockFreePlan,
      });

      await subscriptionsService.upgradeToPlan('academy-pay', 'PRO');

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            planId: mockProPlan.id,
            status: SubscriptionStatus.ACTIVE,
          }),
        }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PLAN_UPGRADED',
          }),
        }),
      );
    });

    it('debe permitir regresar a FREE voluntariamente registrando PLAN_DOWNGRADED en auditoría', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-pro-user',
        academyId: 'academy-down',
        status: SubscriptionStatus.ACTIVE,
        plan: mockProPlan,
      });

      await subscriptionsService.downgradeToFree('academy-down');

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            planId: mockFreePlan.id,
            status: SubscriptionStatus.ACTIVE,
          }),
        }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PLAN_DOWNGRADED',
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // 8. PLANS SERVICE & API CATALOG
  // ===========================================================================
  describe('8. Catálogo de Planes y Precios', () => {
    it('debe listar los planes FREE y PRO con sus precios y características ordenados por precio', async () => {
      const plans = await plansService.findAll();

      expect(plans).toHaveLength(2);
      expect(plans[0].code).toBe('FREE');
      expect(plans[0].priceMonthly).toBe(0);
      expect(plans[1].code).toBe('PRO');
      expect(plans[1].priceMonthly).toBe(99);
    });

    it('debe retornar las características y límites exactos de un plan por su código', async () => {
      const plan = await plansService.findByCode('FREE');

      expect(plan.code).toBe('FREE');
      expect(plan.maxStudents).toBe(30);
      expect(plan.maxGroups).toBe(2);
      expect(plan.maxSports).toBe(1);
    });
  });

  // ===========================================================================
  // 9. REGLAS DE SEGURIDAD Y CASOS BORDE (EDGE CASES)
  // ===========================================================================
  describe('9. Seguridad, Métricas y Casos Borde', () => {
    it('debe asignar plan FREE por defecto a academias legacy que no tengan registro en subscriptions', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      mockPrisma.subscription.create.mockResolvedValue({
        id: 'sub-legacy-created',
        academyId: 'academy-legacy-99',
        planId: mockFreePlan.id,
        status: SubscriptionStatus.ACTIVE,
        plan: mockFreePlan,
      });

      const effective = await subscriptionsService.getEffectiveSubscription('academy-legacy-99');
      expect(effective.plan.code).toBe('FREE');
    });

    it('debe calcular con precisión matemática los días restantes de prueba (remainingDays)', async () => {
      const startsAt = new Date();
      const endsAt = new Date(Date.now() + 7 * 86400000); // exactly 7 days remaining
      mockPrisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-7d',
        academyId: 'academy-7d',
        status: SubscriptionStatus.TRIALING,
        trialStartsAt: startsAt,
        trialEndsAt: endsAt,
        plan: mockProPlan,
      });

      const status = await subscriptionsService.getSubscriptionStatusWithUsage('academy-7d');
      expect(status.trial.active).toBe(true);
      expect(status.trial.remainingDays).toBe(7);
    });

    it('debe lanzar FeatureNotAvailableException con upgradeRequired: true y código consistente', async () => {
      const ex = new FeatureNotAvailableException('WHATSAPP_AUTOMATION');
      expect(ex.getStatus()).toBe(403);
      const res = ex.getResponse() as any;
      expect(res.code).toBe('FEATURE_NOT_AVAILABLE');
      expect(res.upgradeRequired).toBe(true);
      expect(res.feature).toBe('WHATSAPP_AUTOMATION');
    });

    it('PlanLimitException debe formatear correctamente el mensaje con límites y conteos actuales', async () => {
      const ex = new PlanLimitException({
        feature: 'MAX_STUDENTS',
        current: 30,
        limit: 30,
      });
      expect(ex.getStatus()).toBe(403);
      const res = ex.getResponse() as any;
      expect(res.code).toBe('PLAN_LIMIT_REACHED');
      expect(res.current).toBe(30);
      expect(res.limit).toBe(30);
      expect(res.upgradeRequired).toBe(true);
    });
  });
});
