export type WebTabType =
  | 'dashboard'
  | 'students'
  | 'classes'
  | 'cashier'
  | 'billing'
  | 'admin';

export type MembershipRole =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'ADMIN'
  | 'COACH'
  | 'CASHIER'
  | 'STAFF'
  | 'PARENT';

export interface UserMembership {
  academyId: string;
  academyName: string;
  role: MembershipRole;
  isDefault: boolean;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  isSuperAdmin?: boolean;
  role?: MembershipRole;
  memberships: UserMembership[];
}

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

export type ScholarshipType =
  | 'NONE'
  | 'FULL_SCHOLARSHIP'
  | 'HALF_SCHOLARSHIP'
  | 'SIBLING_DISCOUNT'
  | 'CUSTOM_DISCOUNT';

export interface WebFamilyContact {
  id: string;
  familyId: string;
  relationship: 'PADRE' | 'MADRE' | 'APODERADO' | 'TUTOR';
  fullName: string;
  phone: string;
  email?: string;
  documentNumber?: string;
  isPrimary: boolean;
}

export interface WebFamily {
  id: string;
  academyId: string;
  code: string; // e.g. "FAM-001"
  name: string; // e.g. "Familia Cueva Tapia"
  notes?: string;
  source: 'DIRECT' | 'MIGRATION';
  createdAt: string;
  updatedAt: string;
  contacts: WebFamilyContact[];
  studentIds: string[];
  billingPreference?: 'RECIBO' | 'BOLETA' | 'FACTURA';
}

export interface WebStudent {
  id: string;
  academyId: string;
  name: string;
  familyId: string;
  familyName: string;
  contactName: string;
  phone: string;
  email: string;
  documentType: 'DNI' | 'CE' | 'PASAPORTE';
  documentNumber: string;
  birthDate: string;
  age: number;
  sport: string;
  groupName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL';
  monthlyFee: number; // Tarifa base de lista
  scholarshipType?: ScholarshipType;
  scholarshipDiscountPct?: number; // e.g. 100%, 50%, 15%
  scholarshipFixedDiscount?: number; // e.g. S/ 30.00
  scholarshipReason?: string;
  scholarshipApprovedBy?: string;
  finalMonthlyFee?: number; // Tarifa neta efectiva calculada
  balance: number; // 0 = al día, >0 = deuda
  emergencyPhone: string;
  medicalNotes?: string;
  attendanceRate: number; // e.g. 92%
}

export interface WebGroup {
  id: string;
  academyId: string;
  sport: string;
  name: string;
  coachId: string;
  coachName: string;
  court: string;
  scheduleText: string;
  days: string[];
  startTime: string;
  endTime: string;
  studentCount: number;
  capacity: number;
}

export interface WebAttendanceRecord {
  studentId: string;
  studentName: string;
  documentNumber: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED';
  participationType: 'REGULAR' | 'TRIAL' | 'MAKEUP' | 'GUEST';
  checkInTime?: string;
  remarks?: string;
  justificationReason?: string;
  packageCreditUsed?: boolean;
}

export interface WebClassSession {
  id: string;
  academyId: string;
  groupId: string;
  groupName: string;
  sport: string;
  coachName: string;
  court: string;
  date: string;
  startTime: string;
  endTime: string;
  isToday: boolean;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  capacity?: number;
  attendances: WebAttendanceRecord[];
}

export interface WebCharge {
  id: string;
  academyId: string;
  studentId: string;
  studentName: string;
  familyId: string;
  familyName: string;
  chargeType: 'MONTHLY' | 'ENROLLMENT' | 'UNIFORM' | 'TRIAL' | 'PACKAGE' | 'EVENT' | 'OTHER';
  description: string;
  dueDate: string;
  originalAmount?: number; // Tarifa base antes de beca/descuento
  discountAmount?: number; // Monto descontado
  scholarshipType?: ScholarshipType;
  discountReason?: string;
  amount: number; // Monto final neto a pagar
  paidAmount: number;
  balance: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export type VoucherType = 'RECIBO' | 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';

export interface WebInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  studentName?: string;
}

export interface WebBillingInvoice {
  id: string;
  type: VoucherType;
  series: string;
  correlative: number;
  clientName: string;
  clientDoc: string;
  clientPhone?: string;
  familyId?: string;
  familyName?: string;
  subtotal: number;
  igv: number;
  total: number;
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING' | 'ISSUED' | 'VOIDED';
  sunatCode?: string;
  sunatMessage?: string;
  issuedAt: string;
  digestValue?: string;
  concept?: string;
  items?: WebInvoiceItem[];
  paymentMethod?: string;
  receivedBy?: string;
  isInternalReceipt?: boolean;
  referenceVoucherType?: 'BOLETA' | 'FACTURA' | 'RECIBO';
  referenceVoucherNumber?: string;
  referenceVoucherDate?: string;
  creditNoteReasonCode?: string;
  creditNoteReasonDesc?: string;
  creditNoteReasonDescription?: string;
  isCreditNote?: boolean;
  annulledAt?: string;
  annulledReason?: string;
}

export interface WebPaymentAllocation {
  id: string;
  paymentId: string;
  chargeId: string;
  chargeDescription: string;
  studentId: string;
  studentName: string;
  amount: number;
  allocatedAt: string;
}

export interface WebPayment {
  id: string;
  academyId: string;
  familyId?: string;
  familyName: string;
  studentName: string;
  amount: number;
  paymentMethod: 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CARD' | 'CASH';
  referenceNumber: string;
  paidAt: string;
  receivedBy: string;
  description: string;
  invoiceType?: 'RECIBO' | 'BOLETA' | 'FACTURA';
  invoiceNumber?: string;
  invoiceStatus?: 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'ISSUED';
  studentPhone?: string;
  allocations?: WebPaymentAllocation[];
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
  dueDay: number;
  earlyBirdDiscount: number;
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
    solPassword?: string;
    environment: 'BETA' | 'PRODUCTION';
    certificateStatus: 'VALID' | 'EXPIRING' | 'MISSING';
    certificateExpiresAt: string;
    defaultSeriesBoleta: string;
    defaultSeriesFactura: string;
    defaultSeriesNotaCreditoBoleta?: string;
    defaultSeriesNotaCreditoFactura?: string;
    certificateFileName?: string;
    certificateFileSize?: string;
    certificateUploadedAt?: string;
    certificateIssuer?: string;
    certificateSubject?: string;
    certificateRuc?: string;
    certificatePasswordConfigured?: boolean;
    useCustomCertificate?: boolean;
  };
}

export interface WebCustomerCredit {
  id: string;
  academyId: string;
  familyId: string;
  familyName: string;
  studentId?: string;
  studentName?: string;
  amount: number;
  remaining: number;
  reason: string;
  expiresAt?: string;
  createdAt: string;
  status: 'AVAILABLE' | 'EXHAUSTED' | 'EXPIRED';
}

export interface WebRefund {
  id: string;
  paymentId: string;
  paymentRef?: string;
  studentName: string;
  familyName: string;
  amount: number;
  reason: string;
  processedBy: string;
  refundMethod: 'CASH' | 'YAPE' | 'PLIN' | 'BANK_TRANSFER';
  createdAt: string;
}

export interface WebPackage {
  id: string;
  academyId: string;
  name: string;
  sport?: string;
  classCount: number;
  bonusClasses: number;
  price: number;
  validityDays: number;
  isActive: boolean;
  description?: string;
}

export interface WebPackageCredit {
  id: string;
  packageId: string;
  packageName: string;
  studentId: string;
  studentName: string;
  totalClasses: number;
  usedClasses: number;
  expiresAt: string;
  createdAt: string;
  status: 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED';
}

export interface WebTrial {
  id: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  sport: string;
  category: string;
  isPaid: boolean;
  price: number;
  converted: boolean;
  convertedAt?: string;
  notes?: string;
  scheduledDate: string;
  createdAt: string;
}

export interface WebPromotion {
  id: string;
  academyId: string;
  code: string;
  name: string;
  description?: string;
  discountPct?: number;
  discountFixed?: number;
  bonusClasses?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
}

export interface WebAcademyPolicy {
  id: string;
  academyId: string;
  allowTrainingWithDebt: boolean;
  debtWarningThreshold: number;
  cancellationPolicy: 'CREDIT' | 'MAKEUP' | 'NONE';
  siblingDiscountPct: number;
  maxMakeupClassesPerMonth: number;
  lateGracePeriodMinutes: number;
  updatedAt: string;
}

export interface WebCashClosing {
  id: string;
  academyId: string;
  closingNumber: string; // e.g. "CC-20260301-01"
  closedAt: string;
  closedBy: string;
  periodStart: string;
  periodEnd: string;
  totalCashSystem: number;
  totalYapeSystem: number;
  totalPlinSystem: number;
  totalCardSystem: number;
  totalTransferSystem: number;
  totalSystem: number;
  cashCounted: number;
  cashDifference: number; // cashCounted - totalCashSystem (0 = conforme, <0 faltante, >0 sobrante)
  notes?: string;
  transactionsCount: number;
  status: 'CLOSED';
}

export interface WebWhatsAppReminderLog {
  id: string;
  familyId?: string;
  familyName: string;
  studentName: string;
  phone: string;
  reminderType: 'PREVENTIVE' | 'DUE_TODAY' | 'OVERDUE' | 'PAYMENT_RECEIPT';
  amount: number;
  messageText: string;
  sentAt: string;
  sentBy: string;
}

