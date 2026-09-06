# Academy Mobile (APK de Campo)

Aplicación móvil enfocada en el **Dueño, Encargado o Cajero de la Academia Deportiva en Campo** (a pie de cancha).

Diseñada para operar con una sola mano, bajo el sol y en la dinámica rápida de 4:00 PM a 7:30 PM (cuando llegan los alumnos y apoderados).

---

## Módulos Principales (Flujos de Cancha)

1. **Puerta / Filtro & Semáforo de Deuda (`MobileGateCheckView`)**:
   - Búsqueda instantánea por Nombre, DNI o Apoderado.
   - Semáforo tributario y de cobranza:
     - 🟢 **Verde (Al día)**: S/ 0.00. Pasa directo.
     - 🟡 **Ámbar (Cuota corriente del mes)**: S/ 180.00. Permitido entrenar.
     - 🔴 **Rojo (Alerta crítica 2+ meses)**: S/ 360.00+. Alerta discreta en puerta.
   - Botón directo para enviar **Recordatorio amable de Yape por WhatsApp** en 1 toque.
   - Ficha médica de emergencia visible (alergias, asma, etc.).

2. **Asistencia Rápida en 30 Segundos (`MobileAttendanceView`)**:
   - Todos los alumnos inician marcados como **Presentes** por defecto.
   - Botones táctiles de gran tamaño: **Presente**, **Tarde**, **Falta**, **Justificada**.
   - **Aviso de Seguridad por WhatsApp**: Si un alumno falta, aparece un botón directo para alertar al apoderado:
     > *"Estimada Carmen: Le informamos que Mateo no ha ingresado al entrenamiento de hoy. ¿Se encuentra todo bien?"*

3. **Gestión de Clases & Avisos (`MobileSessionManagerView`)**:
   - Para imprevistos (cancha cerrada por municipalidad, lluvia, salud del profesor).
   - Botón **Suspender Clase de Hoy**:
     - Solicita motivo y fecha/hora de reprogramación.
   - **Difusión a Grupo de WhatsApp**:
     - Genera comunicado oficial con formato perfecto y abre WhatsApp para enviarlo al grupo de padres.

4. **Caja Rápida de Campo (`MobileExpressCashierView`)**:
   - Cobro express de cuota mediante **Yape**, **Plin**, **Efectivo** o **Tarjeta POS**.
   - Ingreso rápido del código de operación (4 dígitos).
   - Descuenta automáticamente el saldo del alumno.
   - Emite **Recibo Digital** y lo envía directamente al WhatsApp del apoderado.

---

## Cómo compilar a APK Android

Esta aplicación está desarrollada con React 19 y Tailwind CSS, lista para empaquetarse a APK nativo mediante **Capacitor**:

```bash
# 1. Instalar dependencias
npm install

# 2. Agregar Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Inicializar Capacitor
npx cap init "Academy Mobile" "pe.academy.mobile" --web-dir dist

# 4. Compilar proyecto
npm run build

# 5. Agregar Android y sincronizar
npx cap add android
npx cap sync

# 6. Abrir en Android Studio y generar APK firmado
npx cap open android
```

O para desarrollo local:
```bash
npm run dev
```
