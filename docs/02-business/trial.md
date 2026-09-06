# 02 - Negocio: Mecánica de la Prueba Gratuita de 14 Días

## 1. Activación del Trial
- **Sin Tarjeta de Crédito Requerida**: Reduce la fricción de onboarding al mínimo.
- En el momento de la ejecución de `AcademiesService.create()`:
  ```typescript
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  ```
- Se inserta en la tabla `subscriptions`:
  - `status`: `TRIALING`
  - `planId`: ID del Plan `PRO`
  - `trialStartsAt`: Fecha y hora exacta de creación
  - `trialEndsAt`: Fecha y hora calculada (+14 días)
- Se emite en `audit_logs`:
  - `action`: `TRIAL_STARTED`
  - `entity`: `Subscription`

---

## 2. Detección y Expiración Automatizada
Existen dos niveles complementarios de control:
1. **Control en tiempo de petición (Lazy Evaluation)**:
   - Al invocar `SubscriptionsService.getEffectiveSubscription(academyId)`, si `status === 'TRIALING'` y `now >= trialEndsAt`, se actualiza automáticamente el registro a `EXPIRED` con el plan `FREE`.
2. **Control por Job en Segundo Plano (Proactive BullMQ Worker)**:
   - Job programado en la cola `subscriptions`:
     ```bash
     subscription:expire-trials
     ```
   - El worker evalúa por lotes las academias vencidas, actualiza el plan y registra el evento `TRIAL_EXPIRED` en la bitácora de auditoría.
