# 03 - Arquitectura: Módulo de Suscripciones y Límites SaaS

## 1. Patrón de Diseño
El modelo SaaS se integra limpiamente en el **Modular Monolith Multi-Tenant** sin fragmentar la base de código:
* Todas las academias comparten las mismas tablas de dominio (`students`, `groups`, `invoices`, `sports`).
* La segregación de funciones se realiza mediante capas ortogonales de:
  - **`TenantGuard`**: Garantiza aislamiento de tenant (`academyId`).
  - **`FeatureGuard`**: Evalúa si la funcionalidad solicitada (`@RequireFeature`) está permitida en el plan activo.
  - **`PlanLimitService`**: Valida límites cuantitativos antes de ejecutar inserciones (`assertCanAddStudent`, `assertCanAddGroup`, `assertCanAddSport`, `assertCanAddUser`).

---

## 2. Diagrama de Flujo de Validación de Endpoint

```
[ HTTP Request ]
       │
       ▼
[ JwtAuthGuard ] ── (¿Token JWT Válido?) ── No ──► HTTP 401 Unauthorized
       │ Sí
       ▼
[ TenantGuard ] ── (¿Usuario pertenece a Academy?) ── No ──► HTTP 403 Forbidden
       │ Sí (Inyecta req.tenant = { academyId, role })
       ▼
[ FeatureGuard ] ── (¿Plan tiene la feature requerida?) ── No ──► HTTP 403 FEATURE_NOT_AVAILABLE
       │ Sí
       ▼
[ Controller ]
       │
       ▼
[ PlanLimitService ] ── (¿Supera límite cuantitativo?) ── Sí ──► HTTP 403 PLAN_LIMIT_REACHED
       │ No
       ▼
[ Domain Service & DB ]
```

---

## 3. Worker BullMQ: Expiración de Pruebas
- Cola: `subscriptions`
- Job: `expire-trials`
- Conexión: Redis (puerto 6379)
- Concurrencia: 2 workers
- Reintentos exponenciales automáticos ante fallos transitorios
