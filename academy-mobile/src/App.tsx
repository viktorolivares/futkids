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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start antialiased font-sans select-none">
      {/* Viewport Mode Switcher for Desktop Testing */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-bold text-white uppercase">ACADEMY-MOBILE (APK CAMPO)</span>
          <span className="hidden sm:inline text-slate-500">• Dueño / Encargado / Cajero</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {isPhoneFrame ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3 text-emerald-400" />}
            <span>{isPhoneFrame ? 'Ver Pantalla Completa' : 'Simular Móvil (Marco)'}</span>
          </button>
        </div>
      </div>

      {/* Main Container: Mobile phone frame or full responsive width */}
      <div
        className={`w-full transition-all duration-200 ${
          isPhoneFrame
            ? 'max-w-[430px] my-4 rounded-3xl border-4 border-slate-800 shadow-2xl bg-slate-950 overflow-hidden min-h-[860px]'
            : 'max-w-2xl px-2 py-2'
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
