export enum PlanFeatureKey {
  // Free & Pro Features
  BASIC_STUDENTS = 'BASIC_STUDENTS',
  BASIC_GROUPS = 'BASIC_GROUPS',
  ATTENDANCE = 'ATTENDANCE',
  ENROLLMENTS = 'ENROLLMENTS',
  TRIALS = 'TRIALS',
  GUESTS = 'GUESTS',
  MAKEUP_CLASSES = 'MAKEUP_CLASSES',
  BASIC_PROMOTIONS = 'BASIC_PROMOTIONS',
  MANUAL_PAYMENTS = 'MANUAL_PAYMENTS',

  // Pro Exclusive Features
  SUNAT_BILLING = 'SUNAT_BILLING',
  WHATSAPP_AUTOMATION = 'WHATSAPP_AUTOMATION',
  ADVANCED_REPORTS = 'ADVANCED_REPORTS',
  EXCEL_IMPORT = 'EXCEL_IMPORT',
  ADVANCED_FINANCE = 'ADVANCED_FINANCE',
  PACKAGES = 'PACKAGES',
  AUDIT_LOG = 'AUDIT_LOG',
  ADVANCED_PROMOTIONS = 'ADVANCED_PROMOTIONS',
}

export const FREE_PLAN_LIMITS = {
  maxStudents: 30,
  maxGroups: 2,
  maxSports: 1,
  maxUsers: 2,
};

export const PRO_PLAN_LIMITS = {
  maxStudents: null, // Unlimited
  maxGroups: null,   // Unlimited
  maxSports: null,   // Unlimited
  maxUsers: 10,
};

export const DEFAULT_PLANS_SEED = [
  {
    code: 'FREE',
    name: 'Free',
    description: 'Plan permanente para academias iniciales o pequeñas',
    priceMonthly: 0.0,
    currency: 'PEN',
    ...FREE_PLAN_LIMITS,
    features: [
      { key: PlanFeatureKey.BASIC_STUDENTS, enabled: true, description: 'Gestión básica de hasta 30 alumnos activos' },
      { key: PlanFeatureKey.BASIC_GROUPS, enabled: true, description: 'Hasta 2 grupos o categorías activas' },
      { key: PlanFeatureKey.ATTENDANCE, enabled: true, description: 'Control de asistencias por sesión' },
      { key: PlanFeatureKey.ENROLLMENTS, enabled: true, description: 'Matrículas y estados de alumnos' },
      { key: PlanFeatureKey.TRIALS, enabled: true, description: 'Gestión de clases de prueba' },
      { key: PlanFeatureKey.GUESTS, enabled: true, description: 'Registro de invitados a clase' },
      { key: PlanFeatureKey.MAKEUP_CLASSES, enabled: true, description: 'Clases de recuperación' },
      { key: PlanFeatureKey.BASIC_PROMOTIONS, enabled: true, description: 'Descuento básico de hermanos' },
      { key: PlanFeatureKey.MANUAL_PAYMENTS, enabled: true, description: 'Registro manual de cobros (Efectivo/Yape/Plin)' },
      // Pro features disabled
      { key: PlanFeatureKey.SUNAT_BILLING, enabled: false, description: 'Emisión electrónica directa a SUNAT (Boletas y Facturas UBL 2.1)' },
      { key: PlanFeatureKey.WHATSAPP_AUTOMATION, enabled: false, description: 'Recordatorios y cobranza automática por WhatsApp' },
      { key: PlanFeatureKey.ADVANCED_REPORTS, enabled: false, description: 'Reportes avanzados y exportación contable' },
      { key: PlanFeatureKey.EXCEL_IMPORT, enabled: false, description: 'Importación masiva de alumnos y familias vía Excel' },
      { key: PlanFeatureKey.ADVANCED_FINANCE, enabled: false, description: 'Finanzas avanzadas, notas de crédito y créditos de cliente' },
      { key: PlanFeatureKey.PACKAGES, enabled: false, description: 'Paquetes de clases por cuponera flexible' },
      { key: PlanFeatureKey.AUDIT_LOG, enabled: false, description: 'Historial detallado y auditoría forense de cambios' },
      { key: PlanFeatureKey.ADVANCED_PROMOTIONS, enabled: false, description: 'Campañas promocionales personalizadas y cupones' },
    ],
  },
  {
    code: 'PRO',
    name: 'Pro',
    description: 'Plan completo para academias en crecimiento sin límites operativos',
    priceMonthly: 99.0,
    currency: 'PEN',
    ...PRO_PLAN_LIMITS,
    features: [
      { key: PlanFeatureKey.BASIC_STUDENTS, enabled: true, description: 'Gestión ilimitada de alumnos' },
      { key: PlanFeatureKey.BASIC_GROUPS, enabled: true, description: 'Grupos y categorías ilimitadas' },
      { key: PlanFeatureKey.ATTENDANCE, enabled: true, description: 'Control de asistencias por sesión' },
      { key: PlanFeatureKey.ENROLLMENTS, enabled: true, description: 'Matrículas y estados de alumnos' },
      { key: PlanFeatureKey.TRIALS, enabled: true, description: 'Gestión de clases de prueba' },
      { key: PlanFeatureKey.GUESTS, enabled: true, description: 'Registro de invitados a clase' },
      { key: PlanFeatureKey.MAKEUP_CLASSES, enabled: true, description: 'Clases de recuperación' },
      { key: PlanFeatureKey.BASIC_PROMOTIONS, enabled: true, description: 'Descuento de hermanos automático' },
      { key: PlanFeatureKey.MANUAL_PAYMENTS, enabled: true, description: 'Registro de pagos multicanal' },
      // Pro features enabled
      { key: PlanFeatureKey.SUNAT_BILLING, enabled: true, description: 'Emisión electrónica directa a SUNAT (Boletas y Facturas UBL 2.1)' },
      { key: PlanFeatureKey.WHATSAPP_AUTOMATION, enabled: true, description: 'Recordatorios y cobranza automática por WhatsApp' },
      { key: PlanFeatureKey.ADVANCED_REPORTS, enabled: true, description: 'Reportes avanzados y exportación contable' },
      { key: PlanFeatureKey.EXCEL_IMPORT, enabled: true, description: 'Importación masiva de alumnos y familias vía Excel' },
      { key: PlanFeatureKey.ADVANCED_FINANCE, enabled: true, description: 'Finanzas avanzadas, notas de crédito y créditos de cliente' },
      { key: PlanFeatureKey.PACKAGES, enabled: true, description: 'Paquetes de clases por cuponera flexible' },
      { key: PlanFeatureKey.AUDIT_LOG, enabled: true, description: 'Historial detallado y auditoría forense de cambios' },
      { key: PlanFeatureKey.ADVANCED_PROMOTIONS, enabled: true, description: 'Campañas promocionales personalizadas y cupones' },
    ],
  },
];
