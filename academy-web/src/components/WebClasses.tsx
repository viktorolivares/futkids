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
    <div className="space-y-6 text-sm text-slate-800">
      {/* Header Principal */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Control de Clases y Asistencia
                </h1>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                  En Vivo
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Pase de lista táctil, control de aforo en cancha y avisos directos por WhatsApp a apoderados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsNotifyAbsentsOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
            title="Abrir panel de notificación de inasistencias por WhatsApp a apoderados"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Notificar Faltas ({absentCount})</span>
          </button>

          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
            title="Añadir un alumno a esta sesión (Recuperación, Clase de Prueba o Invitado)"
          >
            <UserPlus className="w-4 h-4" />
            <span>Incorporar a Cancha</span>
          </button>
        </div>
      </div>

      {/* Floating Notices */}
      {notificationSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-sm flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notificationSuccessNotice}</span>
          </div>
          <button onClick={() => setNotificationSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Sessions Selector / Right Attendance Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sessions List & Court Capacities */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Sesiones del Día ({sessions.length})</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">Fecha: {currentSession?.date}</span>
            </div>

            <div className="space-y-2.5">
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
                    className={`w-full p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/40 text-slate-900 shadow-xs'
                        : 'border-slate-200/70 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>{sess.groupName}</span>
                        {sessTotal >= sessCap && (
                          <span className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-semibold">
                            Lleno
                          </span>
                        )}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                        {sess.sport}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {sess.startTime} - {sess.endTime}
                      </span>
                      <span>•</span>
                      <span>{sess.court}</span>
                    </div>

                    {/* Aforo gauge bar */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Prof: <strong className="text-slate-700 font-medium">{sess.coachName}</strong>
                        </span>
                        <span className="font-semibold text-slate-700">
                          {sessTotal}/{sessCap} aforo ({sessPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            sessPct >= 100 ? 'bg-rose-500' : sessPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${sessPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200/50">
                      <span className="text-slate-400">Presentes:</span>
                      <span className="text-emerald-700 font-semibold">
                        {sessPresent} de {sessTotal} ({sessTotal > 0 ? Math.round((sessPresent / sessTotal) * 100) : 0}%)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canchas y Aforos de Sede */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Capacidades por Categoría</span>
            </h2>
            <div className="space-y-2">
              {groups.map((grp) => (
                <div key={grp.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <div className="text-slate-900 font-bold text-xs">{grp.name}</div>
                    <div className="text-xs text-slate-500">{grp.court}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {grp.scheduleText} • {grp.startTime} - {grp.endTime}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Capacidad</span>
                    <span className="font-bold text-blue-700 text-xs">{grp.capacity} cupos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Interactive Attendance Table & Operations */}
        <div className="lg:col-span-8 space-y-4">
          {currentSession && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
              {/* Session Meta Header with Live Capacity Meter */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase">
                      En Cancha
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">
                      {currentSession.groupName}
                    </h2>
                    <span className="text-slate-500 text-sm">({currentSession.sport})</span>
                  </div>
                  <div className="text-slate-500 text-xs mt-1.5 flex items-center gap-2 flex-wrap">
                    <span>Profesor: <strong className="text-slate-800">{currentSession.coachName}</strong></span>
                    <span>•</span>
                    <span>Horario: {currentSession.startTime} - {currentSession.endTime}</span>
                    <span>•</span>
                    <span>Cancha: <strong className="text-slate-800">{currentSession.court}</strong></span>
                  </div>
                </div>

                {/* Live Capacity Gauge */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 min-w-[230px]">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Control de Aforo</span>
                    </span>
                    <span className={`font-bold ${isFullCapacity ? 'text-rose-600' : capacityPct > 80 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {totalEnrolled} / {sessionCapacity} ({capacityPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFullCapacity ? 'bg-rose-500' : capacityPct > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                    <span>{isFullCapacity ? 'Aforo completo' : `${sessionCapacity - totalEnrolled} cupos libres`}</span>
                    <span className="text-emerald-700 font-semibold">{presentCount} en cancha</span>
                  </div>
                </div>
              </div>

              {/* Banner de Políticas de Sede aplicadas a la Cancha */}
              <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-600">
                    <strong className="text-slate-800">Política de Sede:</strong>{' '}
                    {policy.allowTrainingWithDebt ? (
                      <span className="text-amber-700">
                        Entrenamiento permitido con deuda (aviso visual si &gt; S/ {policy.debtWarningThreshold.toFixed(2)})
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold">
                        Bloqueo de cancha por deuda &gt; S/ {policy.debtWarningThreshold.toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span>
                    Compensación Falta:{' '}
                    <strong className="text-slate-800">
                      {policy.cancellationPolicy === 'CREDIT'
                        ? 'Crédito a Favor'
                        : policy.cancellationPolicy === 'MAKEUP'
                        ? 'Recuperación'
                        : 'Sin Compensación'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Acciones Rápidas y Filtros */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar alumno por nombre o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos ({totalCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('PRESENT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      statusFilter === 'PRESENT'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Presentes ({presentCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('ABSENT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      statusFilter === 'ABSENT'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Faltas ({absentCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('SPECIAL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      statusFilter === 'SPECIAL'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    Especiales ({specialCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('DEBT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      statusFilter === 'DEBT'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Con Deuda ({debtCount})
                  </button>
                </div>

                {/* Bulk Check-in Button */}
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                  title="Marcar todos los alumnos habilitados como Presentes de una sola vez"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>Marcar Todos</span>
                </button>
              </div>

              {/* Alerts */}
              {debtBlockedNotice && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-rose-900">
                        Acceso a Cancha Bloqueado por Deuda Pendiente
                      </div>
                      <p className="text-xs text-rose-700 mt-0.5">
                        El alumno <strong>{debtBlockedNotice.studentName}</strong> mantiene una deuda de{' '}
                        <strong>S/ {debtBlockedNotice.balance.toFixed(2)}</strong>. Según la política activa de la academia,
                        no se le permite entrenar hasta regularizar su situación en Caja.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDebtBlockedNotice(null)}
                    className="text-rose-400 hover:text-rose-700 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {creditNotice && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-emerald-900 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{creditNotice}</span>
                  </div>
                  <button
                    onClick={() => setCreditNotice(null)}
                    className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Alumno</th>
                      <th className="pb-3 pr-4">Modalidad</th>
                      <th className="pb-3 pr-4">Marcación de Asistencia</th>
                      <th className="pb-3 pr-4">Avisos Apoderado</th>
                      <th className="pb-3">Observaciones Técnicas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendances.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
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
                          <tr key={att.studentId} className="hover:bg-slate-50/70 transition">
                            {/* Alumno Info */}
                            <td className="py-3.5 pr-4">
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                                <span>{att.studentName}</span>
                                {isDebtBlocked && (
                                  <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                                    Bloq. Deuda (S/ {stu?.balance.toFixed(2)})
                                  </span>
                                )}
                                {hasDebtWarning && (
                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium">
                                    Debe: S/ {stu?.balance.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>DNI: {att.documentNumber}</span>
                                {pkgCredit && (
                                  <span className="text-purple-700 flex items-center gap-1 font-semibold">
                                    <Ticket className="w-3 h-3" />
                                    Tiquetera: {pkgCredit.usedClasses}/{pkgCredit.totalClasses} (
                                    {pkgCredit.totalClasses - pkgCredit.usedClasses} disp.)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Modalidad & Conversión de Trial */}
                            <td className="py-3.5 pr-4">
                              <div className="space-y-1.5">
                                <select
                                  value={att.participationType}
                                  onChange={(e) =>
                                    handleParticipationTypeChange(att.studentId, e.target.value as any)
                                  }
                                  className={`border rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none transition ${
                                    att.participationType === 'TRIAL'
                                      ? 'bg-purple-50 border-purple-200 text-purple-800'
                                      : att.participationType === 'MAKEUP'
                                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                                      : att.participationType === 'GUEST'
                                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
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
                                    className="block text-[11px] bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded-lg transition cursor-pointer"
                                    title="Convertir a este alumno de prueba en alumno regular matriculado"
                                  >
                                    ★ Matricular
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Marcación de Asistencia */}
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Presente */}
                                {isDebtBlocked ? (
                                  <button
                                    onClick={() =>
                                      setDebtBlockedNotice({
                                        studentName: att.studentName,
                                        balance: stu?.balance || 0,
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer"
                                    title="Entrenamiento bloqueado por deuda según la política de la sede"
                                  >
                                    Bloqueado
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusChange(att.studentId, 'PRESENT')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                      att.status === 'PRESENT'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
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
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                      att.status === 'LATE'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                                    }`}
                                    title="Marcar Llegada Tarde"
                                  >
                                    Tarde
                                  </button>
                                )}

                                {/* Ausente */}
                                <button
                                  onClick={() => handleStatusChange(att.studentId, 'ABSENT')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    att.status === 'ABSENT'
                                      ? 'bg-rose-500 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                                  }`}
                                  title="Marcar Falta Injustificada"
                                >
                                  Falta
                                </button>

                                {/* Justificado */}
                                <button
                                  onClick={() => handleStatusChange(att.studentId, 'JUSTIFIED')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    att.status === 'JUSTIFIED'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                                  }`}
                                  title="Marcar Falta Justificada"
                                >
                                  Justif.
                                </button>
                              </div>

                              {att.justificationReason && (
                                <div className="text-xs text-blue-700 mt-1 font-medium">
                                  <span>Motivo: {att.justificationReason}</span>
                                </div>
                              )}

                              {att.checkInTime && (
                                <div className="text-xs text-emerald-700 mt-0.5">
                                  Ingreso: {att.checkInTime}
                                </div>
                              )}
                            </td>

                            {/* WhatsApp Direct Notification */}
                            <td className="py-3.5 pr-4">
                              {att.status === 'ABSENT' || att.status === 'LATE' || att.status === 'JUSTIFIED' ? (
                                <a
                                  href={generateWhatsAppUrl(att, att.status as any)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition"
                                  title={`Enviar aviso WhatsApp por ${att.status === 'ABSENT' ? 'Inasistencia' : att.status === 'LATE' ? 'Tardanza' : 'Justificación'}`}
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>WhatsApp</span>
                                </a>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>

                            {/* Observaciones Técnicas */}
                            <td className="py-3.5">
                              <input
                                type="text"
                                placeholder="Progreso, actitud, notas..."
                                value={att.remarks || ''}
                                onChange={(e) => handleRemarksChange(att.studentId, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
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
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Total alumnos: <strong className="text-slate-800">{totalCount}</strong> | Presentes:{' '}
                  <strong className="text-emerald-700">{presentCount}</strong> | Faltas:{' '}
                  <strong className="text-rose-700">{absentCount}</strong>
                </div>

                <button
                  onClick={() => {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2000);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                  <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          Registrar Asistencia Justificada
                        </h3>
                      </div>
                      <button
                        onClick={() => setJustifyingStudent(null)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="text-sm text-slate-600">
                      Alumno: <strong className="text-slate-900">{justifyingStudent.studentName}</strong> (DNI:{' '}
                      {justifyingStudent.documentNumber})
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Motivo de la Justificación:
                      </label>
                      <select
                        value={justificationReason}
                        onChange={(e) => setJustificationReason(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="Descanso Médico / Salud">Descanso Médico / Salud</option>
                        <option value="Viaje Familiar Programado">Viaje Familiar Programado</option>
                        <option value="Aviso Previo &gt;24 horas">Aviso Previo &gt;24 horas</option>
                        <option value="Fuerza Mayor / Emergencia">Fuerza Mayor / Emergencia</option>
                        <option value="Examen Escolar / Académico">Examen Escolar / Académico</option>
                      </select>
                    </div>

                    {/* Resumen de Política Aplicable */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs space-y-1.5">
                      <div className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                        Efecto de la Política de Sede:
                      </div>
                      {policy.cancellationPolicy === 'CREDIT' ? (
                        <div className="text-emerald-800 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Crédito a Favor:</strong> Se generará un saldo a favor
                            de ~S/ 22.50 a la familia para descontar en su próxima mensualidad o compra de indumentaria.
                          </span>
                        </div>
                      ) : policy.cancellationPolicy === 'MAKEUP' ? (
                        <div className="text-blue-800 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Clase de Recuperación:</strong> El alumno queda habilitado para
                            recuperar esta clase en otro grupo o día disponible.
                          </span>
                        </div>
                      ) : (
                        <div className="text-slate-600">
                          Sin compensación económica ni reprogramación (política estricta).
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setJustifyingStudent(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmJustification}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Confirmar Justificación</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Incorporación Dinámica de Alumno a Cancha */}
              {isAddStudentOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                  <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Incorporar Alumno a Cancha
                          </h3>
                          <p className="text-xs text-slate-500">
                            Sesión: {currentSession.groupName} ({currentSession.court})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsAddStudentOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Alerta de Aforo Si está Lleno */}
                    {isFullCapacity && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Advertencia de Capacidad Máxima:</strong> La cancha ya tiene {totalEnrolled} de {sessionCapacity} alumnos registrados. Al agregar este alumno, se registrará como <strong>sobrecupo autorizado</strong> por el entrenador.
                        </div>
                      </div>
                    )}

                    <div className="space-y-3.5 text-xs">
                      {/* Modalidad de Participación */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Modalidad de Participación:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                addParticipationType === t.id
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70'
                              }`}
                            >
                              <div className="text-xs font-semibold">{t.label}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Selector de Alumno Existente o Nuevo */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Seleccionar Alumno:
                        </label>
                        <select
                          value={selectedAddStudentId}
                          onChange={(e) => setSelectedAddStudentId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
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
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                          <div>
                            <label className="text-xs text-slate-600 font-medium block mb-1">Nombre Completo del Postulante/Invitado:</label>
                            <input
                              type="text"
                              value={addCustomName}
                              onChange={(e) => setAddCustomName(e.target.value)}
                              placeholder="Ej. Matías Paredes Rivas"
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 font-medium block mb-1">DNI / Teléfono de Contacto:</label>
                            <input
                              type="text"
                              value={addCustomDoc}
                              onChange={(e) => setAddCustomDoc(e.target.value)}
                              placeholder="Ej. 74892011 / 987654321"
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Observación */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Nota u Observación Técnica:
                        </label>
                        <input
                          type="text"
                          value={addRemarks}
                          onChange={(e) => setAddRemarks(e.target.value)}
                          placeholder="Ej. Autorizado para recuperar clase del 24/02"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setIsAddStudentOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddStudentToSession}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Confirmar e Ingresar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Conversión de Trial a Alumno Regular */}
              {convertingTrialStudent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                  <div className="bg-white border border-purple-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Convertir a Matrícula Regular
                          </h3>
                          <p className="text-xs text-purple-700">
                            Alumno: {convertingTrialStudent.studentName}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setConvertingTrialStudent(null)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600">
                      El alumno ha culminado su clase de prueba. Al matricularlo, pasará a la lista regular de este grupo ({currentSession.groupName}) y se le asignará su tarifa mensual formativa.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Pensión Mensual a Asignar (S/):
                      </label>
                      <input
                        type="number"
                        value={conversionMonthlyFee}
                        onChange={(e) => setConversionMonthlyFee(Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setConvertingTrialStudent(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmConvertTrial}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Confirmar Matrícula</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Notificaciones Masivas WhatsApp a Inasistentes */}
              {isNotifyAbsentsOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                  <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Avisos WhatsApp de Inasistencias
                          </h3>
                          <p className="text-xs text-slate-500">
                            Sesión: {currentSession.groupName} ({currentSession.date})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsNotifyAbsentsOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600">
                      A continuación se listan los alumnos que registraron falta o tardanza en la sesión de hoy. Haga clic para enviar el aviso pre-redactado:
                    </p>

                    <div className="space-y-2.5">
                      {currentSession.attendances
                        .filter((a) => a.status === 'ABSENT' || a.status === 'LATE' || a.status === 'JUSTIFIED')
                        .map((att) => {
                          const contact = getParentContact(att.studentId);
                          const waUrl = generateWhatsAppUrl(att, att.status as any);

                          return (
                            <div
                              key={att.studentId}
                              className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <span>{att.studentName}</span>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                      att.status === 'ABSENT'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : att.status === 'LATE'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}
                                  >
                                    {att.status === 'ABSENT' ? 'Falta' : att.status === 'LATE' ? 'Tardanza' : 'Justif.'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  Apoderado:{' '}
                                  <strong className="text-slate-700">{contact?.fullName || 'Registrado en ficha'}</strong>{' '}
                                  ({contact?.phone || 'Sin número'})
                                </div>
                              </div>

                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-xs shrink-0"
                              >
                                <Send className="w-3.5 h-3.5 text-white" />
                                <span>Enviar WhatsApp</span>
                              </a>
                            </div>
                          );
                        })}

                      {currentSession.attendances.filter(
                        (a) => a.status === 'ABSENT' || a.status === 'LATE' || a.status === 'JUSTIFIED',
                      ).length === 0 && (
                        <div className="py-8 text-center text-emerald-700 font-semibold text-sm">
                          ¡Excelente! No hay inasistencias registradas en esta sesión. Asistencia 100%.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setIsNotifyAbsentsOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition"
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
