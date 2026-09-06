# 02 - Negocio: Ciclo de Vida de las Suscripciones

## 1. Estados de la Suscripción (`SubscriptionStatus`)

1. **`TRIALING`**:
   - Asignado inmediatamente al crear la academia.
   - Duración: exactamente 14 días corridos.
   - Plan vinculado: `PRO`.
   - Permisos y límites: idénticos a cliente de pago Pro.
2. **`ACTIVE`**:
   - Suscripción Pro activa (con cobro recurrente mensual) o Plan Free indefinido.
3. **`EXPIRED`**:
   - Trial finalizado sin haber ingresado tarjeta o pagado suscripción Pro.
   - El sistema conmuta el `planId` al Plan `FREE` de inmediato.
   - Mantiene todos los accesos básicos y bloquea altas adicionales si sobrepasa límites.
4. **`CANCELED`**:
   - Cliente Pro que solicitó no renovar. Pasa a Free al finalizar su periodo prepagado.

---

## 2. Reglas de Negocio de Cobro y Facturación de Licencia SaaS
- Moneda: Soles Peruanos (`PEN`).
- Facturación recurrente cada 30 días.
- Medios de pago aceptados: Pasarela online (tarjeta de débito/crédito) o transferencia empresarial confirmada.
- Notificaciones de aviso:
  - Día 7 de prueba: Recordatorio de funciones aprovechadas.
  - Día 12 de prueba (2 días antes): Aviso preventivo de expiración inminente.
  - Día 14 de prueba: Conmutación a Free e invitación a reactivar Pro.

---

## 3. Preservación de Información (Cero Pérdida de Datos)
- Al descender de Pro a Free, ninguna base de datos sufre `DELETE` ni `CASCADE`.
- Si la academia tenía 60 alumnos, los 60 siguen figurando en sus listas, pueden registrar su asistencia y pagar sus cuotas.
- Solo se restringe el botón de `Nuevo Alumno` hasta que la cantidad baje de 30 o actualice a Pro.
- Los comprobantes electrónicos emitidos a SUNAT durante el periodo Pro permanecen consultables y descargables permanentemente.
