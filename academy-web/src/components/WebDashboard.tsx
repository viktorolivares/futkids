import React, { useState } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Award,
  FileCheck,
  Zap,
} from 'lucide-react';
import {
  WebStudent,
  WebClassSession,
  WebCharge,
  WebPayment,
  DemoUser,
  SubscriptionStatusInfo,
} from '../types';

interface WebDashboardProps {
  students: WebStudent[];
  sessions: WebClassSession[];
  charges: WebCharge[];
  payments: WebPayment[];
  currentUser: DemoUser;
  academyName: string;
  onNavigate: (tab: any) => void;
  onSelectSession: (session: WebClassSession) => void;
  subscription?: SubscriptionStatusInfo;
  onOpenPlansModal?: () => void;
}

export const WebDashboard: React.FC<WebDashboardProps> = ({
  students,
  sessions,
  charges,
  payments,
  currentUser,
  academyName,
  onNavigate,
  onSelectSession,
  subscription,
  onOpenPlansModal,
}) => {
  const [copiedReminder, setCopiedReminder] = useState<string | null>(null);

  // Totales financieros
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPendingDebt = charges
    .filter((c) => c.status !== 'PAID')
    .reduce((acc, c) => acc + c.balance, 0);
  const activeStudentsCount = students.filter((s) => s.status === 'ACTIVE').length;
  const trialStudentsCount = students.filter((s) => s.status === 'TRIAL').length;
  const debtorsCount = students.filter((s) => s.balance > 0).length;

  // Becas y Subsidios
  const scholarshipStudents = students.filter(
    (s) => s.scholarshipType && s.scholarshipType !== 'NONE'
  );
  const totalMonthlyScholarshipSupport = scholarshipStudents.reduce((acc, s) => {
    const effectiveFee =
      s.finalMonthlyFee !== undefined
        ? s.finalMonthlyFee
        : s.scholarshipType === 'FULL_SCHOLARSHIP'
        ? 0
        : s.scholarshipType === 'HALF_SCHOLARSHIP'
        ? s.monthlyFee * 0.5
        : s.monthlyFee;
    return acc + Math.max(0, s.monthlyFee - effectiveFee);
  }, 0);

  const todaySessions = sessions.filter((s) => s.isToday);

  const handleCopyWhatsAppReminder = (charge: WebCharge) => {
    const text = `Estimada ${charge.familyName}, le saludamos cordialmente de ${academyName}. Le recordamos amablemente que la pensión de ${charge.studentName} (${charge.description}) por el monto de S/ ${charge.balance.toFixed(2)} se encuentra pendiente. Puede cancelarlo mediante Yape, Plin o transferencia BCP. ¡Muchas gracias!`;
    navigator.clipboard.writeText(text);
    setCopiedReminder(charge.id);
    setTimeout(() => setCopiedReminder(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner - Clean & Warm */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
              {academyName}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-xs font-medium">
              Rol: {currentUser.roleLabel}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Buenos días, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1.5 leading-relaxed max-w-2xl">
            Aquí tienes el resumen operativo y financiero de tu academia deportiva para hoy.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('classes')}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Tomar Asistencia</span>
          </button>
          <button
            onClick={() => onNavigate('cashier')}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Cobrar Cuota</span>
          </button>
        </div>
      </div>

      {/* Plan Status Notice (Light & Discreet) */}
      {subscription && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-3 flex-wrap text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Plan Actual:</span>
              <span className="px-2.5 py-0.5 rounded-lg font-bold bg-white border border-slate-200 text-slate-800 flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {subscription.plan.name}
              </span>
            </div>

            {subscription.status === 'TRIALING' && (
              <span className="text-purple-700 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {subscription.trial.remainingDays} días de prueba restantes
              </span>
            )}

            <span className="text-slate-400 hidden sm:inline">•</span>
            <span>
              Alumnos activos: <strong className="text-slate-900">{students.length}</strong> / {subscription.limits.students ?? 'Ilimitados'}
            </span>
          </div>

          <button
            onClick={onOpenPlansModal}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" /> Administrar Plan
          </button>
        </div>
      )}

      {/* Primary KPI Metrics - Calm, High Legibility, Soft Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recaudación */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Cobrado este mes</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            S/ {totalCollected.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{payments.length} pagos registrados en caja</span>
          </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Por Cobrar</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            S/ {totalPendingDebt.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {debtorsCount} alumnos con cuotas pendientes
          </div>
        </div>

        {/* Alumnos Activos */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Alumnos Activos</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeStudentsCount}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {trialStudentsCount > 0 ? `+${trialStudentsCount} en clase de prueba` : 'Matrículas vigentes'}
          </div>
        </div>

        {/* SUNAT Estado */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Comprobantes SUNAT</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
            <span>100% OK</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Sincronizado
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Boletas y facturas UBL 2.1
          </div>
        </div>
      </div>

      {/* Becas & Subsidios Formativos (Soft Card) */}
      {scholarshipStudents.length > 0 && (
        <div className="bg-purple-50/50 border border-purple-200/80 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-purple-200 flex items-center justify-center text-purple-600 shadow-2xs shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Programa de Becas y Convenios
                </h3>
                <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                  {scholarshipStudents.length} alumnos
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Subsidio formativo de <strong>S/ {totalMonthlyScholarshipSupport.toFixed(2)}/mes</strong> en becas y descuentos para hermanos.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('students')}
            className="px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ver Alumnos Beneficiados</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2-Column Section: Today's Sessions & Pending Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Clases de Hoy */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Clases de Hoy ({todaySessions.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigate('classes')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver cronograma</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todaySessions.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                No hay sesiones programadas para hoy.
              </p>
            ) : (
              <div className="space-y-3">
                {todaySessions.map((session) => {
                  const totalStudents = session.attendances.length;
                  const presentStudents = session.attendances.filter(
                    (a) => a.status === 'PRESENT',
                  ).length;

                  return (
                    <div
                      key={session.id}
                      className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl hover:border-slate-300 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              {session.groupName}
                            </span>
                            <span className="text-xs bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                              {session.sport}
                            </span>
                            {session.status === 'IN_PROGRESS' && (
                              <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                                En Cancha
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 mt-2 flex items-center gap-3">
                            <span className="flex items-center gap-1 font-medium text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {session.startTime} - {session.endTime}
                            </span>
                            <span>•</span>
                            <span>{session.court}</span>
                            <span>•</span>
                            <span className="text-slate-600">{session.coachName}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onSelectSession(session);
                            onNavigate('classes');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>Tomar Lista ({presentStudents}/{totalStudents})</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Alumnos preview */}
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium">Alumnos:</span>
                        {session.attendances.map((att) => (
                          <span
                            key={att.studentId}
                            className="text-xs px-2 py-0.5 rounded-lg bg-white text-slate-700 border border-slate-200 flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{att.studentName.split(' ')[0]} {att.studentName.split(' ')[1] || ''}</span>
                            {att.participationType === 'TRIAL' && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1 rounded">
                                Prueba
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Últimos Pagos Registrados */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Últimos Pagos en Caja
                </h2>
              </div>
              <button
                onClick={() => onNavigate('cashier')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver historial</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {payments.slice(0, 3).map((pay) => (
                <div
                  key={pay.id}
                  className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex items-center justify-between text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shadow-2xs">
                      {pay.paymentMethod === 'YAPE' ? 'YP' : pay.paymentMethod === 'PLIN' ? 'PL' : 'BCP'}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{pay.studentName}</div>
                      <div className="text-xs text-slate-500">
                        {pay.description} • Op: {pay.referenceNumber}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-emerald-700 text-sm">
                      S/ {pay.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {pay.invoiceNumber ? (
                        <span className="text-emerald-600 font-medium">
                          {pay.invoiceNumber} (SUNAT)
                        </span>
                      ) : (
                        <span>Boleta pendiente</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Cobranzas Pendientes & Acciones Rápidas */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cuentas por Cobrar con Botón WhatsApp */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Cobros Pendientes
                </h2>
              </div>
              <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                {charges.filter((c) => c.status !== 'PAID').length} por cobrar
              </span>
            </div>

            <div className="space-y-3">
              {charges
                .filter((c) => c.status !== 'PAID')
                .slice(0, 5)
                .map((charge) => (
                  <div
                    key={charge.id}
                    className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                          <span>{charge.studentName}</span>
                          {charge.scholarshipType && charge.scholarshipType !== 'NONE' && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.2 rounded-md font-semibold">
                              {charge.scholarshipType === 'HALF_SCHOLARSHIP'
                                ? 'Semibeca 50%'
                                : charge.scholarshipType === 'SIBLING_DISCOUNT'
                                ? 'Desc. Hermanos'
                                : 'Beca'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {charge.familyName} • {charge.description}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-amber-700 text-sm">
                          S/ {charge.balance.toFixed(2)}
                        </div>
                        {charge.discountAmount && charge.discountAmount > 0 && (
                          <div className="text-xs text-slate-400 line-through">
                            S/ {charge.originalAmount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span>Vence: {charge.dueDate}</span>
                      <button
                        onClick={() => handleCopyWhatsAppReminder(charge)}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition font-semibold cursor-pointer"
                        title="Copiar mensaje personalizado de WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {copiedReminder === charge.id ? '¡Copiado!' : 'Avisar WhatsApp'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Acciones Frecuentes
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <button
                onClick={() => onNavigate('students')}
                className="p-4 bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 rounded-2xl text-left transition space-y-1.5 cursor-pointer"
              >
                <div className="p-2 w-fit rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">Nuevo Alumno</div>
                <div className="text-xs text-slate-500">Matrícula y ficha médica</div>
              </button>

              <button
                onClick={() => onNavigate('billing')}
                className="p-4 bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 rounded-2xl text-left transition space-y-1.5 cursor-pointer"
              >
                <div className="p-2 w-fit rounded-xl bg-emerald-50 text-emerald-600">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">Boleta SUNAT</div>
                <div className="text-xs text-slate-500">Emitir comprobante</div>
              </button>

              <button
                onClick={() => onNavigate('classes')}
                className="p-4 bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 rounded-2xl text-left transition space-y-1.5 cursor-pointer"
              >
                <div className="p-2 w-fit rounded-xl bg-purple-50 text-purple-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">Grupos y Turnos</div>
                <div className="text-xs text-slate-500">Canchas y categorías</div>
              </button>

              <button
                onClick={() => onNavigate('cashier')}
                className="p-4 bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 rounded-2xl text-left transition space-y-1.5 cursor-pointer"
              >
                <div className="p-2 w-fit rounded-xl bg-amber-50 text-amber-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">Caja Diaria</div>
                <div className="text-xs text-slate-500">Flujo y arqueo de caja</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
