import React, { useState } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Award,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import {
  WebStudent,
  WebClassSession,
  WebCharge,
  WebPayment,
  DemoUser,
  SubscriptionStatusInfo,
} from '../types';
import { Zap } from 'lucide-react';

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

  // Totales financieros calculados con exactitud
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPendingDebt = charges
    .filter((c) => c.status !== 'PAID')
    .reduce((acc, c) => acc + c.balance, 0);
  const activeStudentsCount = students.filter((s) => s.status === 'ACTIVE').length;
  const trialStudentsCount = students.filter((s) => s.status === 'TRIAL').length;
  const debtorsCount = students.filter((s) => s.balance > 0).length;

  // Métricas de Becas y Subsidios Formativos
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
    <div className="space-y-4">
      {/* Welcome & Context Banner */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30 font-bold uppercase">
              SEDE ACTIVA
            </span>
            <span className="text-slate-400 font-bold uppercase">
              {academyName}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-bold">
              ROL: {currentUser.roleLabel}
            </span>
          </div>
          <h1 className="text-lg font-bold text-white mt-1 font-mono uppercase tracking-wide">
            Panel Operativo de la Academia
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión en tiempo real de alumnos, asistencia en cancha, caja y comprobantes electrónicos SUNAT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('classes')}
            className="px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>TOMAR LISTA HOY</span>
          </button>
          <button
            onClick={() => onNavigate('cashier')}
            className="px-3 py-1.5 rounded bg-[#161B22] hover:bg-slate-800 border border-slate-700 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>REGISTRAR COBRO</span>
          </button>
        </div>
      </div>

      {/* SaaS Plan & Resource Status Widget */}
      {subscription && (
        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase text-[10px]">PLAN SAAS:</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${
                  subscription.status === 'TRIALING'
                    ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                    : subscription.plan.code === 'PRO'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                {subscription.plan.name.toUpperCase()} (S/ {subscription.plan.priceMonthly.toFixed(2)}/mes)
              </span>
            </div>

            {subscription.status === 'TRIALING' && (
              <div className="flex items-center gap-1.5 text-purple-300 bg-purple-950/30 px-2 py-0.5 rounded border border-purple-800/40 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Prueba activa: <strong className="text-white">{subscription.trial.remainingDays} días restantes</strong></span>
              </div>
            )}

            <div className="text-slate-400 text-[11px]">
              Alumnos: <strong className="text-sky-400">{students.length}</strong> / {subscription.limits.students ?? 'Ilimitados'}
            </div>

            <div className="text-slate-400 text-[11px]">
              SUNAT: <strong className={subscription.features.SUNAT_BILLING ? 'text-emerald-400' : 'text-slate-600'}>
                {subscription.features.SUNAT_BILLING ? 'HABILITADA' : 'SÓLO PRO'}
              </strong>
            </div>
          </div>

          <button
            onClick={onOpenPlansModal}
            className="px-3 py-1 bg-[#161B22] hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white rounded text-[11px] flex items-center gap-1.5 transition font-semibold"
          >
            <Zap className="w-3 h-3 text-amber-400" /> Administrar Suscripción y Límites
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Recaudación */}
        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>RECAUDACIÓN HOY</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            S/ {totalCollected.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>{payments.length} transacciones verificadas (Yape/Plin/BCP)</span>
          </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>POR COBRAR (DEUDAS)</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            S/ {totalPendingDebt.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {debtorsCount} alumnos con saldo pendiente de pago
          </div>
        </div>

        {/* Alumnos Activos */}
        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ALUMNOS ACTIVOS</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {activeStudentsCount}
          </div>
          <div className="text-[10px] text-sky-400 font-mono">
            +{trialStudentsCount} en clase de prueba (Trial)
          </div>
        </div>

        {/* SUNAT Estado */}
        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>FACTURACIÓN SUNAT</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400 flex items-center gap-1.5">
            <span>100% OK</span>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded uppercase">
              BETA
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            UBL 2.1 • Boletas & Facturas sincronizadas
          </div>
        </div>
      </div>

      {/* Programa Formativo y Becas Card */}
      {scholarshipStudents.length > 0 && (
        <div className="bg-[#0F1219] border border-purple-500/30 rounded p-3.5 font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Programa de Becas & Convenios Formativos
                </span>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-bold">
                  {scholarshipStudents.length} ALUMNOS BENEFICIADOS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Inversión formativa / subsidio mensual de la academia:{' '}
                <strong className="text-purple-300">
                  S/ {totalMonthlyScholarshipSupport.toFixed(2)} /mes
                </strong>{' '}
                en talentos destacados, semibecas y convenios de hermanos.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('students')}
            className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[11px] font-bold uppercase transition flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <span>Ver Fichas de Becados</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 2-Column Split: Today's Classes & Pending Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Clases y Entrenamientos de Hoy */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-[#0F1219] border border-slate-800 rounded p-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Entrenamientos y Sesiones de Hoy ({todaySessions.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigate('classes')}
                className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>Ver cronograma</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {todaySessions.map((session) => {
                const totalStudents = session.attendances.length;
                const presentStudents = session.attendances.filter(
                  (a) => a.status === 'PRESENT',
                ).length;

                return (
                  <div
                    key={session.id}
                    className="p-3 bg-[#161B22] border border-slate-800 rounded hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {session.groupName}
                          </span>
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                            {session.sport}
                          </span>
                          {session.status === 'IN_PROGRESS' && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold animate-pulse">
                              EN CANCHA
                            </span>
                          )}
                          {session.status === 'SCHEDULED' && (
                            <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded">
                              PROGRAMADA
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {session.startTime} - {session.endTime}
                          </span>
                          <span>•</span>
                          <span>{session.court}</span>
                          <span>•</span>
                          <span className="text-slate-300">{session.coachName}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectSession(session);
                          onNavigate('classes');
                        }}
                        className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded text-[10px] font-bold uppercase transition flex items-center gap-1"
                      >
                        <span>Asistencia ({presentStudents}/{totalStudents})</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Alumnos en sesión preview */}
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] text-slate-500 uppercase">Alumnos:</span>
                      {session.attendances.map((att) => (
                        <span
                          key={att.studentId}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/50 flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>{att.studentName.split(' ')[0]} {att.studentName.split(' ')[1]}</span>
                          {att.participationType === 'TRIAL' && (
                            <span className="text-[8px] bg-amber-400/20 text-amber-300 px-1 rounded">
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
          </div>

          {/* Últimos Pagos Registrados en Caja */}
          <div className="bg-[#0F1219] border border-slate-800 rounded p-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Últimos Pagos Confirmados (Yape, Plin, BCP)
                </h2>
              </div>
              <button
                onClick={() => onNavigate('cashier')}
                className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>Ver libro de caja</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {payments.slice(0, 3).map((pay) => (
                <div
                  key={pay.id}
                  className="p-2.5 bg-[#161B22] border border-slate-800 rounded flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-sky-400">
                      {pay.paymentMethod === 'YAPE' ? 'YP' : pay.paymentMethod === 'PLIN' ? 'PL' : 'BCP'}
                    </span>
                    <div>
                      <div className="font-bold text-white">{pay.studentName}</div>
                      <div className="text-[10px] text-slate-400">
                        {pay.description} • Op: <span className="text-slate-300">{pay.referenceNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-emerald-400">
                      S/ {pay.amount.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {pay.invoiceNumber ? (
                        <span className="text-sky-400 font-bold">
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
        <div className="lg:col-span-5 space-y-3 font-mono">
          {/* Cuentas por Cobrar con Botón WhatsApp */}
          <div className="bg-[#0F1219] border border-slate-800 rounded p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Cobranzas Pendientes
                </h2>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                {charges.filter((c) => c.status !== 'PAID').length} Cobros
              </span>
            </div>

            <div className="space-y-2">
              {charges
                .filter((c) => c.status !== 'PAID')
                .map((charge) => (
                  <div
                    key={charge.id}
                    className="p-2.5 bg-[#161B22] border border-slate-800 rounded space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                          <span>{charge.studentName}</span>
                          {charge.scholarshipType && charge.scholarshipType !== 'NONE' && (
                            <span className="text-[8px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1 py-0.2 rounded font-bold uppercase">
                              {charge.scholarshipType === 'HALF_SCHOLARSHIP'
                                ? 'Semibeca 50%'
                                : charge.scholarshipType === 'SIBLING_DISCOUNT'
                                ? 'Desc. Hermanos'
                                : 'Beca / Convenio'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {charge.familyName} • {charge.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-400 text-xs">
                          S/ {charge.balance.toFixed(2)}
                        </div>
                        {charge.discountAmount && charge.discountAmount > 0 && (
                          <div className="text-[9px] text-slate-500 line-through">
                            S/ {charge.originalAmount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span>Vencimiento: {charge.dueDate}</span>
                      <button
                        onClick={() => handleCopyWhatsAppReminder(charge)}
                        className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1 transition"
                        title="Copiar mensaje personalizado de WhatsApp"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>
                          {copiedReminder === charge.id ? '¡Copiado!' : 'Recordatorio WhatsApp'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-[#0F1219] border border-slate-800 rounded p-4 space-y-2.5">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Acciones Frecuentes
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('students')}
                className="p-2.5 bg-[#161B22] hover:bg-slate-800 border border-slate-800 rounded text-left transition space-y-1 group"
              >
                <Users className="w-4 h-4 text-sky-400 group-hover:scale-110 transition" />
                <div className="font-bold text-white text-[11px]">Nuevo Alumno</div>
                <div className="text-[9px] text-slate-500">Matrícula y ficha médica</div>
              </button>

              <button
                onClick={() => onNavigate('billing')}
                className="p-2.5 bg-[#161B22] hover:bg-slate-800 border border-slate-800 rounded text-left transition space-y-1 group"
              >
                <FileCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                <div className="font-bold text-white text-[11px]">Factura SUNAT</div>
                <div className="text-[9px] text-slate-500">Emitir Boleta o Factura</div>
              </button>

              <button
                onClick={() => onNavigate('classes')}
                className="p-2.5 bg-[#161B22] hover:bg-slate-800 border border-slate-800 rounded text-left transition space-y-1 group"
              >
                <Calendar className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                <div className="font-bold text-white text-[11px]">Clases y Grupos</div>
                <div className="text-[9px] text-slate-500">Canchas y categorías</div>
              </button>

              <button
                onClick={() => onNavigate('api-console')}
                className="p-2.5 bg-[#161B22] hover:bg-slate-800 border border-slate-800 rounded text-left transition space-y-1 group"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <div className="font-bold text-white text-[11px]">Consola API / Tests</div>
                <div className="text-[9px] text-slate-500">29 tests y Swagger</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
