import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Save,
  Users,
  Award,
  Sparkles,
  ChevronRight,
  Filter,
  Check,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Ticket,
  DollarSign,
  FileCheck,
  X,
  MessageCircle,
  UserPlus,
  Search,
  Send,
  Layers,
  Activity,
  CheckCheck,
  TrendingUp,
  UserCheck,
  UserX,
  ExternalLink,
  Phone,
} from 'lucide-react';
import {
  WebClassSession,
  WebGroup,
  WebAttendanceRecord,
  WebStudent,
  WebFamily,
  WebAcademyPolicy,
  WebPackageCredit,
  WebCustomerCredit,
} from '../types';

interface WebClassesProps {
  sessions: WebClassSession[];
  groups: WebGroup[];
  selectedSession: WebClassSession | null;
  students?: WebStudent[];
  families?: WebFamily[];
  policy?: WebAcademyPolicy;
  packageCredits?: WebPackageCredit[];
  onUpdateSession: (updatedSession: WebClassSession) => void;
  onGenerateCustomerCredit?: (credit: WebCustomerCredit) => void;
  onConsumePackageCredit?: (studentId: string) => void;
  onConvertTrial?: (trialId: string) => void;
  academyName?: string;
}

export const WebClasses: React.FC<WebClassesProps> = ({
  sessions,
  groups,
  selectedSession: initialSelectedSession,
  students = [],
  families = [],
  policy = {
    id: 'pol-default',
    academyId: 'acad-alianza-01',
    allowTrainingWithDebt: true,
    debtWarningThreshold: 50.0,
    cancellationPolicy: 'CREDIT',
    siblingDiscountPct: 15.0,
    maxMakeupClassesPerMonth: 2,
    lateGracePeriodMinutes: 15,
    updatedAt: '2026-03-01',
  },
  packageCredits = [],
  onUpdateSession,
  onGenerateCustomerCredit,
  onConsumePackageCredit,
  onConvertTrial,
  academyName = 'Academia Formativa Alianza Lima',
}) => {
  const [activeSessionId, setActiveSessionId] = useState<string>(
    initialSelectedSession?.id || sessions[0]?.id || '',
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Filtros de la lista de asistencia
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'SPECIAL' | 'DEBT'>('ALL');

  // Modal para justificar falta con motivo y opción de crédito
  const [justifyingStudent, setJustifyingStudent] = useState<{
    studentId: string;
    studentName: string;
    documentNumber: string;
  } | null>(null);
  const [justificationReason, setJustificationReason] = useState('Descanso Médico / Salud');
  const [creditNotice, setCreditNotice] = useState<string | null>(null);

  // Alerta de bloqueo por deuda
  const [debtBlockedNotice, setDebtBlockedNotice] = useState<{
    studentName: string;
    balance: number;
  } | null>(null);

  // Modal para agregar alumno dinámico a la sesión (Recuperación / Trial / Invitado)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedAddStudentId, setSelectedAddStudentId] = useState('');
  const [addParticipationType, setAddParticipationType] = useState<'REGULAR' | 'TRIAL' | 'MAKEUP' | 'GUEST'>('MAKEUP');
  const [addCustomName, setAddCustomName] = useState('');
  const [addCustomDoc, setAddCustomDoc] = useState('');
  const [addRemarks, setAddRemarks] = useState('');

  // Modal de notificación masiva de inasistencias por WhatsApp
  const [isNotifyAbsentsOpen, setIsNotifyAbsentsOpen] = useState(false);
  const [notificationSuccessNotice, setNotificationSuccessNotice] = useState<string | null>(null);

  // Modal de conversión de Trial
  const [convertingTrialStudent, setConvertingTrialStudent] = useState<{
    studentId: string;
    studentName: string;
  } | null>(null);
  const [conversionMonthlyFee, setConversionMonthlyFee] = useState<number>(180);

  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Cálculo de Aforo y Capacidad de Cancha
  const currentGroup = groups.find((g) => g.id === currentSession?.groupId);
  const sessionCapacity = currentSession?.capacity || currentGroup?.capacity || 16;
  const totalEnrolled = currentSession?.attendances.length || 0;
  const capacityPct = Math.min(100, Math.round((totalEnrolled / sessionCapacity) * 100));
  const isFullCapacity = totalEnrolled >= sessionCapacity;

  // Ayudante para buscar teléfono de apoderado
  const getParentContact = (studentId: string) => {
    const stu = students.find((s) => s.id === studentId);
    if (!stu) return null;
    if (stu.familyId) {
      const fam = families.find((f) => f.id === stu.familyId);
      if (fam && fam.contacts && fam.contacts.length > 0) {
        return fam.contacts[0];
      }
    }
    if (stu.emergencyPhone || stu.phone) {
      return {
        fullName: stu.contactName || 'Apoderado',
        phone: stu.emergencyPhone || stu.phone,
        relationship: 'Apoderado',
      };
    }
    return null;
  };

  // Generador de URL de WhatsApp para notificaciones de asistencia
  const generateWhatsAppUrl = (
    att: WebAttendanceRecord,
    type: 'ABSENT' | 'LATE' | 'JUSTIFIED' = 'ABSENT',
  ) => {
    const contact = getParentContact(att.studentId);
    const phone = contact?.phone ? contact.phone.replace(/[^0-9]/g, '') : '51999888777';
    const parentName = contact?.fullName || 'Estimado Apoderado';

    let text = '';
    if (type === 'ABSENT') {
      text = `¡Hola ${parentName}! Le saludamos desde ${academyName}. Le informamos que el día de hoy (${currentSession?.date}) el alumno *${att.studentName}* no asistió a su clase programada de ${currentSession?.sport} (${currentSession?.startTime} a ${currentSession?.endTime}, Cancha: ${currentSession?.court}). Si se debe a un descanso médico o motivo de fuerza mayor, por favor responda a este mensaje para coordinar la justificación oficial y su clase de recuperación.`;
    } else if (type === 'LATE') {
      text = `¡Hola ${parentName}! Le saludamos desde ${academyName}. Le informamos que el alumno *${att.studentName}* ingresó con tardanza (${att.checkInTime || 'hoy'}) a su clase de ${currentSession?.sport}. Agradecemos su puntualidad en las próximas sesiones para cumplir con el calentamiento preventivo.`;
    } else {
      text = `¡Hola ${parentName}! Le confirmamos que la inasistencia de *${att.studentName}* a la clase de ${currentSession?.sport} (${currentSession?.date}) ha sido registrada como *JUSTIFICADA* (${att.justificationReason || 'Aviso previo'}). Se encuentra habilitado el respaldo correspondiente según las normas de la sede.`;
    }

    return `https://wa.me/${phone.startsWith('51') ? phone : '51' + phone}?text=${encodeURIComponent(text)}`;
  };

  const handleStatusChange = (
    studentId: string,
    newStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED',
    reason?: string,
  ) => {
    if (!currentSession) return;

    // Verificar si el alumno tiene deuda y la política no permite entrenar con deuda
    const student = students.find((s) => s.id === studentId);
    if (student && (newStatus === 'PRESENT' || newStatus === 'LATE')) {
      if (!policy.allowTrainingWithDebt && student.balance > policy.debtWarningThreshold) {
        setDebtBlockedNotice({
          studentName: student.name,
          balance: student.balance,
        });
        return;
      }
    }

    // Si marca JUSTIFIED directamente sin motivo, abrir modal
    if (newStatus === 'JUSTIFIED' && !reason) {
      const att = currentSession.attendances.find((a) => a.studentId === studentId);
      if (att) {
        setJustifyingStudent({
          studentId: att.studentId,
          studentName: att.studentName,
          documentNumber: att.documentNumber,
        });
        return;
      }
    }

    const updatedAttendances = currentSession.attendances.map((att) => {
      if (att.studentId === studentId) {
        const isPresent = newStatus === 'PRESENT' || newStatus === 'LATE';
        let packageUsed = att.packageCreditUsed;
        if (isPresent && !packageUsed && onConsumePackageCredit) {
          const pkg = packageCredits.find((p) => p.studentId === studentId && p.status === 'ACTIVE');
          if (pkg && pkg.totalClasses - pkg.usedClasses > 0) {
            onConsumePackageCredit(studentId);
            packageUsed = true;
          }
        }

        return {
          ...att,
          status: newStatus,
          justificationReason: newStatus === 'JUSTIFIED' ? reason || att.justificationReason : undefined,
          packageCreditUsed: packageUsed,
          checkInTime:
            isPresent
              ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined,
        };
      }
      return att;
    });

    const updatedSession: WebClassSession = {
      ...currentSession,
      attendances: updatedAttendances,
    };

    onUpdateSession(updatedSession);
  };

  // Check-in rápido masivo
  const handleMarkAllPresent = () => {
    if (!currentSession) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedAttendances = currentSession.attendances.map((att) => {
      const stu = students.find((s) => s.id === att.studentId);
      const isBlocked = !policy.allowTrainingWithDebt && stu && stu.balance > policy.debtWarningThreshold;

      if (isBlocked) return att;

      return {
        ...att,
        status: 'PRESENT' as const,
        checkInTime: att.checkInTime || timeNow,
      };
    });

    onUpdateSession({
      ...currentSession,
      attendances: updatedAttendances,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleConfirmJustification = () => {
    if (!justifyingStudent || !currentSession) return;

    handleStatusChange(justifyingStudent.studentId, 'JUSTIFIED', justificationReason);

    // Si la política de la academia es CREDIT, generar crédito a favor
    const student = students.find((s) => s.id === justifyingStudent.studentId);
    if (policy.cancellationPolicy === 'CREDIT' && onGenerateCustomerCredit && student) {
      const classCost = Number((student.monthlyFee / 8).toFixed(2)) || 22.5;
      const newCredit: WebCustomerCredit = {
        id: `cred-${Date.now()}`,
        academyId: currentSession.academyId,
        familyId: student.familyId,
        familyName: student.familyName,
        studentId: student.id,
        studentName: student.name,
        amount: classCost,
        remaining: classCost,
        reason: `Falta justificada (${justificationReason}) el ${currentSession.date} en ${currentSession.groupName}`,
        expiresAt: '2026-06-30',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'AVAILABLE',
      };
      onGenerateCustomerCredit(newCredit);
      setCreditNotice(
        `Se ha generado un Crédito a Favor de S/ ${classCost.toFixed(2)} para la ${student.familyName}.`,
      );
      setTimeout(() => setCreditNotice(null), 4000);
    }

    setJustifyingStudent(null);
  };

  const handleParticipationTypeChange = (
    studentId: string,
    type: 'REGULAR' | 'TRIAL' | 'MAKEUP' | 'GUEST',
  ) => {
    if (!currentSession) return;

    const updatedAttendances = currentSession.attendances.map((att) => {
      if (att.studentId === studentId) {
        return {
          ...att,
          participationType: type,
        };
      }
      return att;
    });

    onUpdateSession({
      ...currentSession,
      attendances: updatedAttendances,
    });
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (!currentSession) return;

    const updatedAttendances = currentSession.attendances.map((att) => {
      if (att.studentId === studentId) {
        return {
          ...att,
          remarks,
        };
      }
      return att;
    });

    onUpdateSession({
      ...currentSession,
      attendances: updatedAttendances,
    });
  };

  // Agregar Alumno Dinámico a Sesión (Recuperación / Trial / Invitado)
  const handleAddStudentToSession = () => {
    if (!currentSession) return;

    let targetStudentName = '';
    let targetDoc = '';
    let targetStudentId = selectedAddStudentId;

    if (selectedAddStudentId === 'CUSTOM_NEW') {
      if (!addCustomName.trim()) {
        alert('Por favor ingrese el nombre del alumno o invitado.');
        return;
      }
      targetStudentId = `temp-guest-${Date.now()}`;
      targetStudentName = addCustomName.trim();
      targetDoc = addCustomDoc.trim() || 'S/D';
    } else {
      const existing = students.find((s) => s.id === selectedAddStudentId);
      if (!existing) {
        alert('Seleccione un alumno de la lista.');
        return;
      }
      // Verificar si ya está en la sesión
      if (currentSession.attendances.some((a) => a.studentId === existing.id)) {
        alert('El alumno ya está registrado en esta sesión.');
        return;
      }
      targetStudentName = existing.name;
      targetDoc = existing.documentNumber;
    }

    const newAttendance: WebAttendanceRecord = {
      studentId: targetStudentId,
      studentName: targetStudentName,
      documentNumber: targetDoc,
      status: 'PRESENT',
      participationType: addParticipationType,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      remarks: addRemarks || (addParticipationType === 'MAKEUP' ? 'Recuperación de clase autorizada' : addParticipationType === 'TRIAL' ? 'Clase de Prueba (Trial)' : 'Invitado a sesión'),
    };

    onUpdateSession({
      ...currentSession,
      attendances: [...currentSession.attendances, newAttendance],
    });

    setIsAddStudentOpen(false);
    setSelectedAddStudentId('');
    setAddCustomName('');
    setAddCustomDoc('');
    setAddRemarks('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Conversión rápida de Trial a Regular
  const handleConfirmConvertTrial = () => {
    if (!convertingTrialStudent || !currentSession) return;

    // Actualizar tipo de participación a REGULAR
    handleParticipationTypeChange(convertingTrialStudent.studentId, 'REGULAR');

    if (onConvertTrial) {
      onConvertTrial(convertingTrialStudent.studentId);
    }

    setNotificationSuccessNotice(
      `¡Alumno ${convertingTrialStudent.studentName} convertido exitosamente a Alumno Regular con cuota de S/ ${conversionMonthlyFee.toFixed(2)}/mes!`,
    );
    setTimeout(() => setNotificationSuccessNotice(null), 4000);
    setConvertingTrialStudent(null);
  };

  // Filtrado de alumnos en tabla
  const filteredAttendances = currentSession?.attendances.filter((att) => {
    const matchesSearch =
      att.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.documentNumber.includes(searchTerm);

    if (!matchesSearch) return false;

    if (statusFilter === 'PRESENT') return att.status === 'PRESENT' || att.status === 'LATE';
    if (statusFilter === 'ABSENT') return att.status === 'ABSENT' || att.status === 'JUSTIFIED';
    if (statusFilter === 'SPECIAL') return att.participationType !== 'REGULAR';
    if (statusFilter === 'DEBT') {
      const stu = students.find((s) => s.id === att.studentId);
      return stu && stu.balance > 0;
    }

    return true;
  }) || [];

  const presentCount =
    currentSession?.attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length || 0;
  const absentCount =
    currentSession?.attendances.filter((a) => a.status === 'ABSENT' || a.status === 'JUSTIFIED').length || 0;
  const specialCount =
    currentSession?.attendances.filter((a) => a.participationType !== 'REGULAR').length || 0;
  const debtCount =
    currentSession?.attendances.filter((a) => {
      const stu = students.find((s) => s.id === a.studentId);
      return stu && stu.balance > 0;
    }).length || 0;

  const totalCount = currentSession?.attendances.length || 0;
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Principal */}
      <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>Control de Clases, Aforo y Asistencia en Cancha</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                  PASO C: EN VIVO
                </span>
              </h1>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Pase de lista táctil para entrenadores, control de capacidad máxima de cancha, gestión de recuperaciones/pruebas y avisos WhatsApp a apoderados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsNotifyAbsentsOpen(true)}
            className="px-3 py-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition cursor-pointer"
            title="Abrir panel de notificación de inasistencias por WhatsApp a apoderados"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Notificar Faltas ({absentCount})</span>
          </button>

          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-black font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Añadir un alumno a esta sesión (Recuperación, Clase de Prueba o Invitado)"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Incorporar a Cancha</span>
          </button>
        </div>
      </div>

      {/* Floating Notices */}
      {notificationSuccessNotice && (
        <div className="bg-emerald-950/60 border border-emerald-500/60 rounded-lg p-3 text-emerald-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationSuccessNotice}</span>
          </div>
          <button onClick={() => setNotificationSuccessNotice(null)} className="text-emerald-400 hover:text-white font-bold">
            ×
          </button>
        </div>
      )}

      {/* Main Grid: Left Sessions Selector / Right Attendance Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Sessions List & Court Capacities */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] text-slate-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Sesiones de Hoy ({sessions.length})</span>
              </h2>
              <span className="text-[9px] text-slate-500 font-mono">FECHA: {currentSession?.date}</span>
            </div>

            <div className="space-y-2">
              {sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                const sessGroup = groups.find((g) => g.id === sess.groupId);
                const sessCap = sess.capacity || sessGroup?.capacity || 16;
                const sessTotal = sess.attendances.length;
                const sessPresent = sess.attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
                const sessPct = Math.min(100, Math.round((sessTotal / sessCap) * 100));

                return (
                  <button
                    key={sess.id}
                    onClick={() => setActiveSessionId(sess.id)}
                    className={`w-full p-3 rounded-lg border text-left transition relative cursor-pointer ${
                      isActive
                        ? 'border-sky-500 bg-sky-950/20 text-white shadow-sm'
                        : 'border-slate-800 bg-[#161B22] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>{sess.groupName}</span>
                        {sessTotal >= sessCap && (
                          <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-500/40 px-1 py-0.2 rounded font-mono font-bold">
                            LLENO
                          </span>
                        )}
                      </span>
                      <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-bold">
                        {sess.sport}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {sess.startTime} - {sess.endTime}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">{sess.court}</span>
                    </div>

                    {/* Aforo gauge bar */}
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">
                          Prof: <strong className="text-slate-300">{sess.coachName}</strong>
                        </span>
                        <span className="font-mono font-bold text-slate-300">
                          {sessTotal}/{sessCap} aforo ({sessPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            sessPct >= 100 ? 'bg-rose-500' : sessPct >= 80 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${sessPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80">
                      <span className="text-slate-500 font-mono">Presentes:</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {sessPresent} de {sessTotal} ({sessTotal > 0 ? Math.round((sessPresent / sessTotal) * 100) : 0}%)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canchas y Aforos de Sede */}
          <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-3.5 space-y-2">
            <h2 className="text-[11px] text-slate-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Capacidades de Cancha por Categoría</span>
            </h2>
            <div className="space-y-1.5 text-[11px]">
              {groups.map((grp) => (
                <div key={grp.id} className="p-2.5 bg-[#161B22] rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-xs">{grp.name}</div>
                    <div className="text-[10px] text-slate-400">{grp.court}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {grp.scheduleText} • {grp.startTime} - {grp.endTime}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block uppercase">CAPACIDAD MÁX</span>
                    <span className="font-bold text-sky-400 font-mono text-xs">{grp.capacity} cupos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Interactive Attendance Table & Operations */}
        <div className="lg:col-span-8 space-y-3">
          {currentSession && (
            <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-md">
              {/* Session Meta Header with Live Capacity Meter */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                      EN CANCHA
                    </span>
                    <h2 className="text-base font-bold text-white uppercase">
                      {currentSession.groupName}
                    </h2>
                    <span className="text-slate-400 text-xs">({currentSession.sport})</span>
                  </div>
                  <div className="text-slate-400 text-[10px] mt-1 flex items-center gap-2 flex-wrap">
                    <span>Profesor: <strong className="text-white">{currentSession.coachName}</strong></span>
                    <span>•</span>
                    <span>Horario: {currentSession.startTime} - {currentSession.endTime}</span>
                    <span>•</span>
                    <span>Cancha: <strong className="text-slate-200">{currentSession.court}</strong></span>
                  </div>
                </div>

                {/* Live Capacity Gauge */}
                <div className="bg-[#161B22] border border-slate-800 rounded-lg p-3 min-w-[220px]">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Users className="w-3 h-3 text-sky-400" />
                      <span>Control de Aforo</span>
                    </span>
                    <span className={`font-bold ${isFullCapacity ? 'text-rose-400' : capacityPct > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {totalEnrolled} / {sessionCapacity} ({capacityPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFullCapacity ? 'bg-rose-500' : capacityPct > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                    <span>{isFullCapacity ? 'Aforo completo' : `${sessionCapacity - totalEnrolled} cupos disponibles`}</span>
                    <span className="text-emerald-400 font-bold">{presentCount} en cancha</span>
                  </div>
                </div>
              </div>

              {/* Banner de Políticas de Sede aplicadas a la Cancha */}
              <div className="bg-[#161B22] border border-slate-800/90 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">
                    <strong>Política de Sede:</strong>{' '}
                    {policy.allowTrainingWithDebt ? (
                      <span className="text-amber-300">
                        Entrenamiento permitido con deuda (alerta visual si &gt; S/ {policy.debtWarningThreshold.toFixed(2)})
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold">
                        Bloqueo estricto a cancha por deuda &gt; S/ {policy.debtWarningThreshold.toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span>
                    Compensación Falta:{' '}
                    <strong className="text-sky-300 font-mono">
                      {policy.cancellationPolicy === 'CREDIT'
                        ? 'Crédito Automático a Favor'
                        : policy.cancellationPolicy === 'MAKEUP'
                        ? 'Clase de Recuperación'
                        : 'Sin Compensación'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Acciones Rápidas y Filtros */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar alumno por nombre o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#161B22] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-700 text-white'
                        : 'bg-[#161B22] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Todos ({totalCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('PRESENT')}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                      statusFilter === 'PRESENT'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-[#161B22] text-emerald-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Presentes ({presentCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('ABSENT')}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                      statusFilter === 'ABSENT'
                        ? 'bg-rose-500 text-white'
                        : 'bg-[#161B22] text-rose-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Faltas ({absentCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('SPECIAL')}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                      statusFilter === 'SPECIAL'
                        ? 'bg-purple-500 text-white'
                        : 'bg-[#161B22] text-purple-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Recup/Trial ({specialCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('DEBT')}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                      statusFilter === 'DEBT'
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#161B22] text-amber-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Con Deuda ({debtCount})
                  </button>
                </div>

                {/* Bulk Check-in Button */}
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase text-[10px] flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-sm"
                  title="Marcar todos los alumnos habilitados como Presentes de una sola vez"
                >
                  <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Marcar Todos Presentes</span>
                </button>
              </div>

              {/* Alerts */}
              {debtBlockedNotice && (
                <div className="bg-rose-950/40 border border-rose-500/50 rounded-lg p-3 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-rose-200">
                        Acceso a Cancha Bloqueado por Deuda Pendiente
                      </div>
                      <p className="text-[11px] text-rose-300/90 mt-0.5">
                        El alumno <strong>{debtBlockedNotice.studentName}</strong> mantiene una deuda de{' '}
                        <strong>S/ {debtBlockedNotice.balance.toFixed(2)}</strong>. Según la política activa de la academia,
                        no se le permite entrenar hasta regularizar su situación en Caja.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDebtBlockedNotice(null)}
                    className="text-rose-400 hover:text-white text-xs font-bold"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {creditNotice && (
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-lg p-2.5 flex items-center justify-between gap-2 text-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{creditNotice}</span>
                  </div>
                  <button
                    onClick={() => setCreditNotice(null)}
                    className="text-emerald-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                      <th className="pb-2">Alumno</th>
                      <th className="pb-2">Modalidad</th>
                      <th className="pb-2">Marcación de Asistencia</th>
                      <th className="pb-2">Avisos Apoderado</th>
                      <th className="pb-2">Observaciones Técnicas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredAttendances.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No se encontraron alumnos para este filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendances.map((att) => {
                        const stu = students.find((s) => s.id === att.studentId);
                        const isDebtBlocked =
                          !policy.allowTrainingWithDebt &&
                          stu &&
                          stu.balance > policy.debtWarningThreshold;
                        const hasDebtWarning =
                          policy.allowTrainingWithDebt &&
                          stu &&
                          stu.balance > policy.debtWarningThreshold;
                        const pkgCredit = packageCredits.find(
                          (p) => p.studentId === att.studentId && p.status === 'ACTIVE',
                        );
                        const contact = getParentContact(att.studentId);

                        return (
                          <tr key={att.studentId} className="hover:bg-slate-800/20">
                            {/* Alumno Info */}
                            <td className="py-2.5 pr-2">
                              <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                                <span>{att.studentName}</span>
                                {isDebtBlocked && (
                                  <span className="bg-rose-950/80 text-rose-300 border border-rose-600/50 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                                    🚫 Bloq. Deuda (S/ {stu?.balance.toFixed(2)})
                                  </span>
                                )}
                                {hasDebtWarning && (
                                  <span className="bg-amber-950/70 text-amber-300 border border-amber-600/50 text-[9px] px-1.5 py-0.2 rounded font-mono">
                                    ⚠️ Debe: S/ {stu?.balance.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>DNI: {att.documentNumber}</span>
                                {pkgCredit && (
                                  <span className="text-purple-400 flex items-center gap-1 font-semibold">
                                    <Ticket className="w-2.5 h-2.5" />
                                    Tiquetera: {pkgCredit.usedClasses}/{pkgCredit.totalClasses} (
                                    {pkgCredit.totalClasses - pkgCredit.usedClasses} disp.)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Modalidad & Conversión de Trial */}
                            <td className="py-2.5 pr-2">
                              <div className="space-y-1">
                                <select
                                  value={att.participationType}
                                  onChange={(e) =>
                                    handleParticipationTypeChange(att.studentId, e.target.value as any)
                                  }
                                  className={`border rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                    att.participationType === 'TRIAL'
                                      ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                                      : att.participationType === 'MAKEUP'
                                      ? 'bg-sky-950/60 border-sky-500/50 text-sky-300'
                                      : att.participationType === 'GUEST'
                                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                                      : 'bg-[#161B22] border-slate-700 text-slate-200'
                                  }`}
                                >
                                  <option value="REGULAR">Regular</option>
                                  <option value="TRIAL">Clase Prueba</option>
                                  <option value="MAKEUP">Recuperación</option>
                                  <option value="GUEST">Invitado</option>
                                </select>

                                {/* Botón de Conversión de Trial */}
                                {att.participationType === 'TRIAL' && (
                                  <button
                                    onClick={() =>
                                      setConvertingTrialStudent({
                                        studentId: att.studentId,
                                        studentName: att.studentName,
                                      })
                                    }
                                    className="block text-[9px] bg-purple-500 hover:bg-purple-400 text-black font-bold px-1.5 py-0.5 rounded transition cursor-pointer"
                                    title="Convertir a este alumno de prueba en alumno regular matriculado"
                                  >
                                    ★ Matricular Regular
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Marcación de Asistencia */}
                            <td className="py-2.5 pr-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                {/* Presente */}
                                {isDebtBlocked ? (
                                  <button
                                    onClick={() =>
                                      setDebtBlockedNotice({
                                        studentName: att.studentName,
                                        balance: stu?.balance || 0,
                                      })
                                    }
                                    className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-rose-950/40 text-rose-400 border border-rose-800/60 hover:bg-rose-900/50 cursor-pointer"
                                    title="Entrenamiento bloqueado por deuda según la política de la sede"
                                  >
                                    🚫 Bloq. Deuda
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusChange(att.studentId, 'PRESENT')}
                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                                      att.status === 'PRESENT'
                                        ? 'bg-emerald-500 text-black shadow-sm'
                                        : 'bg-[#161B22] text-slate-400 hover:text-white border border-slate-700'
                                    }`}
                                    title="Marcar Presente"
                                  >
                                    Presente
                                  </button>
                                )}

                                {/* Tarde */}
                                {!isDebtBlocked && (
                                  <button
                                    onClick={() => handleStatusChange(att.studentId, 'LATE')}
                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                                      att.status === 'LATE'
                                        ? 'bg-amber-500 text-black shadow-sm'
                                        : 'bg-[#161B22] text-slate-400 hover:text-white border border-slate-700'
                                    }`}
                                    title="Marcar Llegada Tarde"
                                  >
                                    Tarde
                                  </button>
                                )}

                                {/* Ausente */}
                                <button
                                  onClick={() => handleStatusChange(att.studentId, 'ABSENT')}
                                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                                    att.status === 'ABSENT'
                                      ? 'bg-rose-500 text-white shadow-sm'
                                      : 'bg-[#161B22] text-slate-400 hover:text-white border border-slate-700'
                                  }`}
                                  title="Marcar Falta Injustificada"
                                >
                                  Falta
                                </button>

                                {/* Justificado */}
                                <button
                                  onClick={() => handleStatusChange(att.studentId, 'JUSTIFIED')}
                                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                                    att.status === 'JUSTIFIED'
                                      ? 'bg-sky-500 text-black shadow-sm'
                                      : 'bg-[#161B22] text-slate-400 hover:text-white border border-slate-700'
                                  }`}
                                  title="Marcar Falta Justificada"
                                >
                                  Justif.
                                </button>
                              </div>

                              {att.justificationReason && (
                                <div className="text-[9px] text-sky-400 mt-1 flex items-center gap-1 font-semibold">
                                  <span>📝 Motivo: {att.justificationReason}</span>
                                </div>
                              )}

                              {att.checkInTime && (
                                <div className="text-[9px] text-emerald-400 mt-0.5">
                                  Ingreso registrado: {att.checkInTime}
                                </div>
                              )}
                            </td>

                            {/* WhatsApp Direct Notification */}
                            <td className="py-2.5 pr-2">
                              {att.status === 'ABSENT' || att.status === 'LATE' || att.status === 'JUSTIFIED' ? (
                                <a
                                  href={generateWhatsAppUrl(att, att.status as any)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition"
                                  title={`Enviar aviso WhatsApp por ${att.status === 'ABSENT' ? 'Inasistencia' : att.status === 'LATE' ? 'Tardanza' : 'Justificación'}`}
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-400" />
                                  <span>WhatsApp</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-600">—</span>
                              )}
                            </td>

                            {/* Observaciones Técnicas */}
                            <td className="py-2.5">
                              <input
                                type="text"
                                placeholder="Anotar progreso, actitud, uniforme..."
                                value={att.remarks || ''}
                                onChange={(e) => handleRemarksChange(att.studentId, e.target.value)}
                                className="w-full bg-[#161B22] border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Botón de Guardar en la base de la tabla */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[10px] text-slate-500">
                  Total de alumnos en planilla: <strong className="text-slate-300">{totalCount}</strong> | Presentes:{' '}
                  <strong className="text-emerald-400">{presentCount}</strong> | Faltas:{' '}
                  <strong className="text-rose-400">{absentCount}</strong>
                </div>

                <button
                  onClick={() => {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2000);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>¡Asistencia Guardada!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Registro de Hoy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Modal / Selector de Falta Justificada */}
              {justifyingStudent && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-[#161B22] border border-slate-700 rounded-xl max-w-md w-full p-4 space-y-3 font-mono">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-sky-400" />
                        <h3 className="text-sm font-bold text-white">
                          Registrar Asistencia Justificada
                        </h3>
                      </div>
                      <button
                        onClick={() => setJustifyingStudent(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-300">
                      Alumno: <strong className="text-white">{justifyingStudent.studentName}</strong> (DNI:{' '}
                      {justifyingStudent.documentNumber})
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Motivo de la Justificación:
                      </label>
                      <select
                        value={justificationReason}
                        onChange={(e) => setJustificationReason(e.target.value)}
                        className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-xs text-white"
                      >
                        <option value="Descanso Médico / Salud">Descanso Médico / Salud</option>
                        <option value="Viaje Familiar Programado">Viaje Familiar Programado</option>
                        <option value="Aviso Previo &gt;24 horas">Aviso Previo &gt;24 horas</option>
                        <option value="Fuerza Mayor / Emergencia">Fuerza Mayor / Emergencia</option>
                        <option value="Examen Escolar / Académico">Examen Escolar / Académico</option>
                      </select>
                    </div>

                    {/* Resumen de Política Aplicable */}
                    <div className="bg-[#0F1219] border border-slate-800 rounded p-2.5 text-[11px] space-y-1">
                      <div className="text-slate-400 font-bold uppercase text-[9px]">
                        Efecto de la Política de Sede:
                      </div>
                      {policy.cancellationPolicy === 'CREDIT' ? (
                        <div className="text-emerald-300 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Crédito a Favor Automático:</strong> Se generará un saldo a favor
                            de ~S/ 22.50 a la familia para descontar en su próxima mensualidad o compra de indumentaria.
                          </span>
                        </div>
                      ) : policy.cancellationPolicy === 'MAKEUP' ? (
                        <div className="text-sky-300 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Clase de Recuperación:</strong> El alumno queda habilitado para
                            recuperar esta clase en otro grupo o día disponible.
                          </span>
                        </div>
                      ) : (
                        <div className="text-slate-400">
                          Sin compensación económica ni reprogramación (política estricta).
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setJustifyingStudent(null)}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmJustification}
                        className="px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Confirmar Justificación</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Incorporación Dinámica de Alumno a Cancha */}
              {isAddStudentOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-[#161B22] border border-slate-700 rounded-xl max-w-lg w-full p-4 space-y-4 font-mono">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-sky-400" />
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            Incorporar Alumno a Cancha
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            Sesión: {currentSession.groupName} ({currentSession.court})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsAddStudentOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Alerta de Aforo Si está Lleno */}
                    {isFullCapacity && (
                      <div className="p-2.5 bg-amber-950/50 border border-amber-500/40 rounded-lg text-amber-200 text-[11px] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Advertencia de Capacidad Máxima:</strong> La cancha ya tiene {totalEnrolled} de {sessionCapacity} alumnos registrados. Al agregar este alumno, se registrará como <strong>sobrecupo autorizado</strong> por el entrenador.
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 text-xs">
                      {/* Modalidad de Participación */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">
                          Modalidad de Participación:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { id: 'MAKEUP', label: 'Recuperación', desc: 'Clase pendiente' },
                            { id: 'TRIAL', label: 'Clase Prueba', desc: 'Postulante' },
                            { id: 'GUEST', label: 'Invitado', desc: 'Pase del día' },
                            { id: 'REGULAR', label: 'Regular', desc: 'Inscripción' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setAddParticipationType(t.id as any)}
                              className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                                addParticipationType === t.id
                                  ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                                  : 'bg-[#0D1117] border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="text-[11px]">{t.label}</div>
                              <div className="text-[9px] text-slate-500">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Selector de Alumno Existente o Nuevo */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">
                          Seleccionar Alumno:
                        </label>
                        <select
                          value={selectedAddStudentId}
                          onChange={(e) => setSelectedAddStudentId(e.target.value)}
                          className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-xs text-white"
                        >
                          <option value="">-- Seleccione Alumno Matriculado --</option>
                          {students.map((st) => {
                            const isAlreadyIn = currentSession.attendances.some((a) => a.studentId === st.id);
                            return (
                              <option key={st.id} value={st.id} disabled={isAlreadyIn}>
                                {st.name} — DNI {st.documentNumber} ({st.groupName}){isAlreadyIn ? ' [YA EN SESIÓN]' : ''}
                              </option>
                            );
                          })}
                          <option value="CUSTOM_NEW">+ Ingresar Nuevo Postulante / Invitado Manualmente</option>
                        </select>
                      </div>

                      {/* Campos manuales si seleccionó CUSTOM_NEW */}
                      {selectedAddStudentId === 'CUSTOM_NEW' && (
                        <div className="p-3 bg-[#0D1117] rounded-lg border border-slate-800 space-y-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Nombre Completo del Postulante/Invitado:</label>
                            <input
                              type="text"
                              value={addCustomName}
                              onChange={(e) => setAddCustomName(e.target.value)}
                              placeholder="Ej. Matías Paredes Rivas"
                              className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">DNI / Teléfono de Contacto:</label>
                            <input
                              type="text"
                              value={addCustomDoc}
                              onChange={(e) => setAddCustomDoc(e.target.value)}
                              placeholder="Ej. 74892011 / 987654321"
                              className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Observación */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">
                          Nota u Observación Técnica:
                        </label>
                        <input
                          type="text"
                          value={addRemarks}
                          onChange={(e) => setAddRemarks(e.target.value)}
                          placeholder="Ej. Autorizado por Prof. Juan para recuperar clase del 24/02"
                          className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setIsAddStudentOpen(false)}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddStudentToSession}
                        className="px-3.5 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Confirmar e Ingresar a Cancha</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Conversión de Trial a Alumno Regular */}
              {convertingTrialStudent && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-[#161B22] border border-purple-500/50 rounded-xl max-w-md w-full p-4 space-y-3.5 font-mono">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-400" />
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            Convertir Clase de Prueba a Matrícula
                          </h3>
                          <p className="text-[10px] text-purple-300">
                            Alumno: {convertingTrialStudent.studentName}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setConvertingTrialStudent(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300">
                      El alumno ha culminado su clase de prueba satisfactoriamente. Al matricularlo, pasará a la lista regular de este grupo ({currentSession.groupName}) y se le asignará su tarifa mensual formativa.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold block">
                        Pensión Mensual a Asignar (S/):
                      </label>
                      <input
                        type="number"
                        value={conversionMonthlyFee}
                        onChange={(e) => setConversionMonthlyFee(Number(e.target.value) || 0)}
                        className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-sm text-white font-bold"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setConvertingTrialStudent(null)}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmConvertTrial}
                        className="px-3.5 py-1.5 rounded bg-purple-500 hover:bg-purple-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Confirmar Matrícula Regular</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Notificaciones Masivas WhatsApp a Inasistentes */}
              {isNotifyAbsentsOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-[#161B22] border border-emerald-500/40 rounded-xl max-w-xl w-full p-4 space-y-3.5 font-mono max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            Centro de Notificación WhatsApp de Inasistencias
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            Sesión: {currentSession.groupName} ({currentSession.date})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsNotifyAbsentsOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300">
                      A continuación se listan los alumnos que registraron falta o tardanza en la sesión de hoy. Puede hacer clic en el botón de WhatsApp de cada apoderado para despachar el aviso oficial pre-redactado:
                    </p>

                    <div className="space-y-2">
                      {currentSession.attendances
                        .filter((a) => a.status === 'ABSENT' || a.status === 'LATE' || a.status === 'JUSTIFIED')
                        .map((att) => {
                          const contact = getParentContact(att.studentId);
                          const waUrl = generateWhatsAppUrl(att, att.status as any);

                          return (
                            <div
                              key={att.studentId}
                              className="p-2.5 bg-[#0D1117] border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{att.studentName}</span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                      att.status === 'ABSENT'
                                        ? 'bg-rose-950 text-rose-300'
                                        : att.status === 'LATE'
                                        ? 'bg-amber-950 text-amber-300'
                                        : 'bg-sky-950 text-sky-300'
                                    }`}
                                  >
                                    {att.status === 'ABSENT' ? 'FALTA' : att.status === 'LATE' ? 'TARDE' : 'JUSTIF.'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Apoderado:{' '}
                                  <strong className="text-slate-200">{contact?.fullName || 'Registrado en ficha'}</strong>{' '}
                                  ({contact?.phone || 'Sin cel'})
                                </div>
                              </div>

                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0"
                              >
                                <Send className="w-3 h-3 text-black" />
                                <span>Enviar WhatsApp</span>
                              </a>
                            </div>
                          );
                        })}

                      {currentSession.attendances.filter(
                        (a) => a.status === 'ABSENT' || a.status === 'LATE' || a.status === 'JUSTIFIED',
                      ).length === 0 && (
                        <div className="py-6 text-center text-emerald-400 font-bold">
                          ¡Excelente! No hay inasistencias registradas en esta sesión. Asistencia 100%.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setIsNotifyAbsentsOpen(false)}
                        className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                      >
                        Cerrar Panel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default WebClasses;
