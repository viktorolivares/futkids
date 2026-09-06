export type MobileTab = 'gate' | 'attendance' | 'sessions' | 'cashier';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED';

export type DebtSeverity = 'UP_TO_DATE' | 'CURRENT_DUE' | 'CRITICAL_DEBT';

export interface MobileStudent {
  id: string;
  academyId: string;
  name: string;
  documentType: 'DNI' | 'CE';
  documentNumber: string;
  age: number;
  photoUrl?: string;
  groupId: string;
  groupName: string;
  sport: string;
  monthlyFee: number;
  balance: number; // 0 = al día, >0 = deuda
  debtSeverity: DebtSeverity;
  debtMonthsCount: number;
  parentName: string;
  parentPhone: string;
  emergencyPhone: string;
  medicalNotes?: string;
  lastPaymentDate?: string;
  notes?: string;
}

export interface MobileGroup {
  id: string;
  academyId: string;
  name: string;
  sport: string;
  coachName: string;
  court: string;
  startTime: string;
  endTime: string;
  days: string[];
  studentCount: number;
  capacity: number;
}

export interface MobileSession {
  id: string;
  groupId: string;
  groupName: string;
  court: string;
  coachName: string;
  date: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  cancelReason?: string;
  rescheduledToDate?: string;
  rescheduledToTime?: string;
  attendeesCount: number;
  totalStudents: number;
}

export interface MobileAttendanceRecord {
  studentId: string;
  sessionId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  notes?: string;
}

export interface MobilePaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  amount: number;
  paymentMethod: 'YAPE' | 'PLIN' | 'CASH' | 'CARD' | 'TRANSFER';
  referenceNumber: string;
  timestamp: string;
  concept: string;
  receiptNumber: string;
  discountedBalance: number;
}

export interface MobileAcademyProfile {
  id: string;
  name: string;
  sport: string;
  venueAddress: string;
  currentCourt: string;
  currentShift: string;
  currency: 'PEN';
  phone: string;
  yapeNumber: string;
  plinNumber: string;
  debtWarningThreshold: number; // Ej: S/ 50.00
  allowTrainingWithDebt: boolean;
}
