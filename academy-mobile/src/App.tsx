import React, { useState } from 'react';
import {
  MobileTab,
  MobileStudent,
  MobileSession,
  MobilePaymentRecord,
  AttendanceStatus,
  MobileAcademyProfile,
} from './types';
import {
  INITIAL_MOBILE_ACADEMY,
  INITIAL_MOBILE_STUDENTS,
  INITIAL_MOBILE_SESSIONS,
} from './data/mockMobileData';
import { MobileTopBar } from './components/MobileTopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileGateCheckView } from './components/MobileGateCheckView';
import { MobileAttendanceView } from './components/MobileAttendanceView';
import { MobileSessionManagerView } from './components/MobileSessionManagerView';
import { MobileExpressCashierView } from './components/MobileExpressCashierView';
import { MobileQuickStatsModal } from './components/MobileQuickStatsModal';
import { Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<MobileTab>('gate');
  const [academy, setAcademy] = useState<MobileAcademyProfile>(INITIAL_MOBILE_ACADEMY);
  const [students, setStudents] = useState<MobileStudent[]>(INITIAL_MOBILE_STUDENTS);
  const [sessions, setSessions] = useState<MobileSession[]>(INITIAL_MOBILE_SESSIONS);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);

  // Attendance map: studentId -> status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({
    stu_1: 'PRESENT',
    stu_2: 'PRESENT',
    stu_3: 'ABSENT',
    stu_4: 'PRESENT',
    stu_5: 'PRESENT',
    stu_6: 'LATE',
    stu_7: 'PRESENT',
    stu_8: 'PRESENT',
  });

  // Payments registered today
  const [payments, setPayments] = useState<MobilePaymentRecord[]>([
    {
      id: 'pay_init_1',
      studentId: 'stu_1',
      studentName: 'Mateo Alejandro Benavides',
      parentName: 'Carmen Rosa Paredes',
      parentPhone: '51994821033',
      amount: 180,
      paymentMethod: 'YAPE',
      referenceNumber: 'OP-4912',
      timestamp: '06/09/2026 15:45:10',
      concept: 'Cuota Mensual Septiembre',
      receiptNumber: 'REC-2026-1049',
      discountedBalance: 0,
    },
  ]);

  // Transition helper from Gate to Cashier
  const [preselectedStudentForPayment, setPreselectedStudentForPayment] = useState<MobileStudent | null>(null);
  const [showQuickStats, setShowQuickStats] = useState(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  const activeSession = sessions[activeSessionIndex] || sessions[0];

  // Actions
  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAllPresent = () => {
    const updated = { ...attendanceMap };
    students
      .filter((s) => s.groupId === activeSession.groupId)
      .forEach((s) => {
        updated[s.id] = 'PRESENT';
      });
    setAttendanceMap(updated);
  };

  const handleGoToPayStudent = (student: MobileStudent) => {
    setPreselectedStudentForPayment(student);
    setActiveTab('cashier');
  };

  const handleRegisterPayment = (newPayment: MobilePaymentRecord) => {
    setPayments((prev) => [newPayment, ...prev]);

    // Deduct balance from student
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === newPayment.studentId) {
          const newBal = Math.max(0, s.balance - newPayment.amount);
          return {
            ...s,
            balance: newBal,
            debtSeverity: newBal === 0 ? 'UP_TO_DATE' : newBal > 180 ? 'CRITICAL_DEBT' : 'CURRENT_DUE',
            debtMonthsCount: Math.ceil(newBal / 180),
          };
        }
        return s;
      })
    );
  };

  const handleUpdateSession = (updatedSession: MobileSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
  };

  const totalCollectedToday = payments.reduce((acc, p) => acc + p.amount, 0);
  const criticalDebtCount = students.filter((s) => s.debtSeverity === 'CRITICAL_DEBT').length;
  const pendingAttendanceCount = students.filter(
    (s) => s.groupId === activeSession.groupId && !attendanceMap[s.id]
  ).length;

  return (
    <div className="min-h-[calc(100vh-180px)] bg-transparent text-slate-800 flex flex-col items-center justify-start antialiased font-sans">
      {/* Viewport Mode Switcher for Desktop Testing */}
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl px-4 py-3 mb-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 shadow-xs gap-3">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-900 text-sm">Simulador de App Móvil de Campo</span>
          <span className="hidden sm:inline text-slate-400">• Diseñado para uso táctil rápido en cancha</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
          >
            {isPhoneFrame ? <Monitor className="w-4 h-4 text-slate-600" /> : <Smartphone className="w-4 h-4 text-emerald-600" />}
            <span>{isPhoneFrame ? 'Expandir Vista' : 'Ver como Teléfono Móvil'}</span>
          </button>
        </div>
      </div>

      {/* Main Container: Mobile phone frame or full responsive width */}
      <div
        className={`w-full transition-all duration-200 ${
          isPhoneFrame
            ? 'max-w-[420px] mb-8 rounded-[40px] border-[10px] border-slate-850 shadow-2xl bg-slate-900 overflow-hidden min-h-[840px] ring-1 ring-slate-900/20'
            : 'max-w-3xl bg-slate-900 rounded-3xl p-3 shadow-xl overflow-hidden'
        }`}
      >
        {/* Top Field Bar */}
        <MobileTopBar
          academy={academy}
          activeShift={activeSession ? `${activeSession.startTime} - ${activeSession.endTime}` : '4:00 PM'}
          totalCollectedToday={totalCollectedToday}
          criticalDebtCount={criticalDebtCount}
          onOpenQuickStats={() => setShowQuickStats(true)}
        />

        {/* Content Area */}
        <main className="p-3">
          {activeTab === 'gate' && (
            <MobileGateCheckView
              students={students}
              academy={academy}
              onGoToPayStudent={handleGoToPayStudent}
              onMarkAttendance={(stuId, st) => handleMarkAttendance(stuId, st)}
              currentSessionAttendance={attendanceMap}
            />
          )}

          {activeTab === 'attendance' && (
            <MobileAttendanceView
              session={activeSession}
              students={students}
              academy={academy}
              attendanceMap={attendanceMap}
              onUpdateAttendance={handleMarkAttendance}
              onMarkAllPresent={handleMarkAllPresent}
            />
          )}

          {activeTab === 'sessions' && (
            <MobileSessionManagerView
              sessions={sessions}
              academy={academy}
              onUpdateSession={handleUpdateSession}
            />
          )}

          {activeTab === 'cashier' && (
            <MobileExpressCashierView
              students={students}
              academy={academy}
              preselectedStudent={preselectedStudentForPayment}
              onRegisterPayment={handleRegisterPayment}
              recentPayments={payments}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <MobileBottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          pendingAttendanceCount={pendingAttendanceCount}
          criticalDebtCount={criticalDebtCount}
        />
      </div>

      {/* Daily Quick Stats Modal */}
      <MobileQuickStatsModal
        isOpen={showQuickStats}
        onClose={() => setShowQuickStats(false)}
        academy={academy}
        students={students}
        sessions={sessions}
        payments={payments}
      />
    </div>
  );
}
