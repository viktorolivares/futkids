import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  MessageCircle,
  Send,
  Sparkles,
  Users,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import { MobileStudent, MobileSession, MobileAcademyProfile, AttendanceStatus } from '../types';

interface MobileAttendanceViewProps {
  session: MobileSession;
  students: MobileStudent[];
  academy: MobileAcademyProfile;
  attendanceMap: Record<string, AttendanceStatus>;
  onUpdateAttendance: (studentId: string, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
}

export const MobileAttendanceView: React.FC<MobileAttendanceViewProps> = ({
  session,
  students,
  academy,
  attendanceMap,
  onUpdateAttendance,
  onMarkAllPresent,
}) => {
  const [toastAlert, setToastAlert] = useState<string | null>(null);

  // Group students for this session
  const sessionStudents = students.filter((s) => s.groupId === session.groupId);

  const presentCount = sessionStudents.filter(
    (s) => (attendanceMap[s.id] || 'PRESENT') === 'PRESENT'
  ).length;
  const lateCount = sessionStudents.filter(
    (s) => attendanceMap[s.id] === 'LATE'
  ).length;
  const absentCount = sessionStudents.filter(
    (s) => attendanceMap[s.id] === 'ABSENT'
  ).length;
  const justifiedCount = sessionStudents.filter(
    (s) => attendanceMap[s.id] === 'JUSTIFIED'
  ).length;

  // Send WhatsApp Absence / Security notice to parent
  const sendWhatsAppAbsenceNotice = (student: MobileStudent) => {
    const text = encodeURIComponent(
      `Estimado(a) ${student.parentName}, le saludamos del equipo técnico de ${academy.name}.\n\n` +
      `Le informamos que ${student.name} no se ha presentado al entrenamiento de hoy (${session.startTime} - ${session.endTime}) en ${session.court}.\n\n` +
      `¿Se encuentra todo bien con él? Por favor indíquenos si su inasistencia fue por motivo de salud o escolar para registrarla como Justificada. ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${student.parentPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Toast */}
      {toastAlert && (
        <div className="bg-emerald-950 border border-emerald-500 rounded-lg p-2.5 text-xs text-emerald-200 flex items-center justify-between">
          <span>{toastAlert}</span>
          <button onClick={() => setToastAlert(null)} className="text-emerald-400 font-bold px-1">✕</button>
        </div>
      )}

      {/* Header Card: 30-Second Attendance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white uppercase font-mono">
                {session.groupName}
              </h2>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{session.court}</span>
              <span>•</span>
              <span className="text-amber-400 font-mono">{session.startTime} a {session.endTime}</span>
              <span>•</span>
              <span>{session.coachName}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onMarkAllPresent();
              setToastAlert('¡Todos los alumnos marcados como PRESENTES!');
              setTimeout(() => setToastAlert(null), 3000);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-300 hover:text-white text-[10px] font-bold font-mono transition flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3 h-3" />
            <span>Todos Presentes</span>
          </button>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-4 gap-1.5 mt-2.5 text-center font-mono">
          <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
            <span className="text-[9px] text-emerald-400 block uppercase font-bold">Presentes</span>
            <span className="text-sm font-black text-white">{presentCount}</span>
          </div>
          <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-lg">
            <span className="text-[9px] text-amber-400 block uppercase font-bold">Tardes</span>
            <span className="text-sm font-black text-white">{lateCount}</span>
          </div>
          <div className="p-2 bg-rose-950/40 border border-rose-500/30 rounded-lg">
            <span className="text-[9px] text-rose-400 block uppercase font-bold">Faltas</span>
            <span className="text-sm font-black text-white">{absentCount}</span>
          </div>
          <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">Total</span>
            <span className="text-sm font-black text-white">{sessionStudents.length}</span>
          </div>
        </div>
      </div>

      {/* Student List with 1-touch Status buttons */}
      <div className="space-y-2">
        {sessionStudents.map((student, idx) => {
          const status = attendanceMap[student.id] || 'PRESENT';

          return (
            <div
              key={student.id}
              className={`bg-slate-900 border rounded-xl p-3 transition shadow-sm ${
                status === 'PRESENT'
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : status === 'LATE'
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : status === 'ABSENT'
                  ? 'border-rose-500/50 bg-rose-950/20'
                  : 'border-slate-800'
              }`}
            >
              {/* Row 1: Name and Index */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">{student.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Apoderado: {student.parentName}
                    </span>
                  </div>
                </div>

                {/* Status indicator badge */}
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    status === 'PRESENT'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : status === 'LATE'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : status === 'ABSENT'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {status === 'PRESENT' && '✓ PRESENTE'}
                  {status === 'LATE' && '⏱ TARDE'}
                  {status === 'ABSENT' && '✕ FALTA'}
                  {status === 'JUSTIFIED' && 'JUSTIFICADO'}
                </span>
              </div>

              {/* Row 2: Touch Selector Buttons (30-second speed) */}
              <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onUpdateAttendance(student.id, 'PRESENT')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition flex items-center justify-center gap-1 cursor-pointer ${
                    status === 'PRESENT'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Presente</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateAttendance(student.id, 'LATE')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition flex items-center justify-center gap-1 cursor-pointer ${
                    status === 'LATE'
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Tarde</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateAttendance(student.id, 'ABSENT')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition flex items-center justify-center gap-1 cursor-pointer ${
                    status === 'ABSENT'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <XCircle className="w-3 h-3" />
                  <span>Falta</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateAttendance(student.id, 'JUSTIFIED')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition flex items-center justify-center gap-1 cursor-pointer ${
                    status === 'JUSTIFIED'
                      ? 'bg-sky-500 text-black shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Justif.</span>
                </button>
              </div>

              {/* Row 3: Security WhatsApp Button if ABSENT */}
              {status === 'ABSENT' && (
                <div className="mt-2 pt-2 border-t border-rose-900/50 flex items-center justify-between gap-2 animate-fade-in">
                  <div className="text-[10px] text-rose-300 flex items-center gap-1">
                    <span>⚠️ Alumno no ingresó a cancha.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => sendWhatsAppAbsenceNotice(student)}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 transition"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Avisar a Apoderado por WhatsApp</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default MobileAttendanceView;
