export type AppMode = 'clients-admin' | 'academy-web' | 'api-sandbox' | 'mobile-field';

export type SandboxTabType =
  | 'clients-admin'
  | 'api-console'
  | 'sunat-sandbox'
  | 'health';

export type TabType =
  | SandboxTabType
  | 'explorer'
  | 'architecture';

export interface SaaSClientAcademy {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  ruc: string;
  address: string;
  city: string;
  department: string;
  phone: string;
  email: string;
  contactPerson: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  planStatus: 'TRIALING' | 'ACTIVE' | 'EXPIRED' | 'PAUSED' | 'SUSPENDED';
  trialDaysLeft: number;
  trialEndsAt: string | null;
  mrr: number; // Monthly fee in PEN (S/)
  studentsCount: number;
  studentsLimit: number | null; // null for unlimited
  sportsCount: number;
  groupsCount: number;
  staffCount: number;
  invoicesThisMonth: number;
  sunatStatus: 'CONFIGURED_PROD' | 'CONFIGURED_BETA' | 'PENDING_SOL';
  certificateExpiresAt?: string;
  apiKey: string;
  createdAt: string;
  lastActiveAt: string;
  isSuspended: boolean;
}

export interface UserMembership {
  academyId: string;
  academyName: string;
  role: 'OWNER' | 'ADMIN' | 'COACH' | 'CASHIER' | 'STAFF' | 'PARENT';
  isDefault: boolean;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  memberships: UserMembership[];
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
  path: string;
  summary: string;
  description: string;
  tag:
    | 'Health & Monitoring'
    | 'Auth'
    | 'Academies (Tenants)'
    | 'Memberships & Roles'
    | 'Users'
    | 'SUNAT Facturación Electrónica'
    | 'SaaS & Subscriptions';
  requiresAuth: boolean;
  requiresTenant: boolean;
  requiredRole?: string[];
  defaultHeaders?: Record<string, string>;
  defaultBody?: any;
  defaultParams?: Record<string, string>;
}

export interface ApiResponseSimulation {
  status: number;
  statusText: string;
  durationMs: number;
  data: any;
  headers: Record<string, string>;
}

export interface TestResult {
  suite: string;
  name: string;
  status: 'passed' | 'failed' | 'running';
  durationMs: number;
  details: string;
}

export interface SubscriptionTrialInfo {
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  remainingDays: number;
}

export interface SubscriptionLimitsInfo {
  students: number | null;
  groups: number | null;
  sports: number | null;
  users: number | null;
}

export interface SubscriptionUsageInfo {
  students: number;
  groups: number;
  sports: number;
  users: number;
}

export interface SubscriptionPlanDetails {
  code: 'FREE' | 'PRO';
  name: string;
  priceMonthly: number;
  currency: string;
}

export interface SubscriptionStatusInfo {
  plan: SubscriptionPlanDetails;
  status: 'TRIALING' | 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  trial: SubscriptionTrialInfo;
  limits: SubscriptionLimitsInfo;
  usage: SubscriptionUsageInfo;
  overLimit: boolean;
  features: Record<string, boolean>;
}

export interface WebSportItem {
  id: string;
  name: string;
  iconName: string;
  description: string;
  categories: string[];
  assignedCourts: string[];
  monthlyFee: number;
  activeStudents: number;
  isActive: boolean;
}

export interface WebStaffMember {
  id: string;
  name: string;
  dni: string;
  email: string;
  phone: string;
  role: 'OWNER' | 'ADMIN' | 'COACH' | 'CASHIER' | 'STAFF';
  roleTitle: string;
  sports: string[];
  joinedDate: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  monthlySalary?: number;
}

export interface WebFeeTariff {
  id: string;
  name: string;
  sport: string;
  type: 'MONTHLY' | 'ENROLLMENT' | 'UNIFORM' | 'TRIAL' | 'SPECIAL';
  amount: number;
  frequency: 'MONTHLY' | 'ONE_TIME' | 'PER_SESSION';
  dueDay: number; // e.g. día 5 de cada mes
  earlyBirdDiscount: number; // descuento por pago puntual
  description: string;
  isActive: boolean;
}

export interface WebAcademyProfile {
  id: string;
  name: string;
  legalName: string;
  ruc: string;
  address: string;
  district: string;
  city: string;
  department: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  sunatConfig: {
    solUser: string;
    solPassConfigured: boolean;
    environment: 'BETA' | 'PRODUCTION';
    certificateStatus: 'VALID' | 'EXPIRING' | 'MISSING';
    certificateExpiresAt: string;
    defaultSeriesBoleta: string;
    defaultSeriesFactura: string;
  };
}

