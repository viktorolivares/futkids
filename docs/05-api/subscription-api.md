# 05 - API: Endpoints del Módulo de Suscripciones y Límites

## 1. Endpoints Públicos

### `GET /plans`
Lista todos los planes activos con sus precios, monedas, límites cuantitativos y características detalladas.

#### Respuesta Exitosa (200 OK)
```json
[
  {
    "id": "plan-uuid-1",
    "code": "FREE",
    "name": "Free",
    "description": "Plan permanente para academias iniciales o pequeñas",
    "priceMonthly": 0.0,
    "currency": "PEN",
    "maxStudents": 30,
    "maxGroups": 2,
    "maxSports": 1,
    "maxUsers": 2,
    "features": [
      { "key": "BASIC_STUDENTS", "enabled": true, "description": "Gestión de hasta 30 alumnos" },
      { "key": "SUNAT_BILLING", "enabled": false, "description": "Facturación electrónica SUNAT" }
    ]
  },
  {
    "id": "plan-uuid-2",
    "code": "PRO",
    "name": "Pro",
    "description": "Plan completo para academias sin límites operativos",
    "priceMonthly": 99.0,
    "currency": "PEN",
    "maxStudents": null,
    "maxGroups": null,
    "maxSports": null,
    "maxUsers": 10,
    "features": [
      { "key": "BASIC_STUDENTS", "enabled": true, "description": "Alumnos ilimitados" },
      { "key": "SUNAT_BILLING", "enabled": true, "description": "Facturación electrónica SUNAT" }
    ]
  }
]
```

---

## 2. Endpoints Autenticados (Multi-Tenant)

### `GET /subscription`
- **Headers requeridos**: `Authorization: Bearer <token>`, `x-academy-id: <uuid>`
- **Respuesta**:
```json
{
  "plan": {
    "code": "PRO",
    "name": "Pro",
    "priceMonthly": 99.0,
    "currency": "PEN"
  },
  "status": "TRIALING",
  "trial": {
    "active": true,
    "startsAt": "2026-09-05T12:00:00.000Z",
    "endsAt": "2026-09-19T12:00:00.000Z",
    "remainingDays": 14
  },
  "limits": {
    "students": null,
    "groups": null,
    "sports": null,
    "users": 10
  },
  "usage": {
    "students": 18,
    "groups": 2,
    "sports": 1,
    "users": 2
  },
  "overLimit": false,
  "features": {
    "BASIC_STUDENTS": true,
    "SUNAT_BILLING": true,
    "WHATSAPP_AUTOMATION": true,
    "ADVANCED_REPORTS": true
  }
}
```

### `POST /subscription/upgrade`
- **Body**: `{ "planCode": "PRO" }`
- Activa el plan Pro por 30 días.

### `POST /subscription/downgrade`
- **Body**: `{ "planCode": "FREE" }`
- Conmuta la suscripción al plan Free preservando el 100% de la información histórica.

---

## 3. Códigos de Error Específicos

### `HTTP 403 Forbidden` - Límite de Alumnos Alcanzado
```json
{
  "statusCode": 403,
  "code": "PLAN_LIMIT_REACHED",
  "message": "Has alcanzado el límite de alumnos de tu plan gratuito (30 alumnos activos). Actualiza a Pro para registrar alumnos ilimitados.",
  "feature": "MAX_STUDENTS",
  "current": 30,
  "limit": 30,
  "upgradeRequired": true
}
```

### `HTTP 403 Forbidden` - Funcionalidad Reservada para Plan Pro
```json
{
  "statusCode": 403,
  "code": "FEATURE_NOT_AVAILABLE",
  "message": "La funcionalidad 'SUNAT_BILLING' está reservada para el plan Pro. Actualiza tu suscripción para desbloquearla.",
  "feature": "SUNAT_BILLING",
  "upgradeRequired": true
}
```
