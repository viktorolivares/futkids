import React, { useState } from 'react';
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  MapPin,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Building,
  Sparkles,
} from 'lucide-react';
import { MobileSession, MobileAcademyProfile } from '../types';

interface MobileSessionManagerViewProps {
  sessions: MobileSession[];
  academy: MobileAcademyProfile;
  onUpdateSession: (updatedSession: MobileSession) => void;
}

export const MobileSessionManagerView: React.FC<MobileSessionManagerViewProps> = ({
  sessions,
  academy,
  onUpdateSession,
}) => {
  const [selectedSessionForCancel, setSelectedSessionForCancel] = useState<MobileSession | null>(null);
  const [cancelReason, setCancelReason] = useState('Mantenimiento técnico y desinfección de campo sintético');
  const [rescheduledDate, setRescheduledDate] = useState('2026-09-12');
  const [rescheduledTime, setRescheduledTime] = useState('10:00 - 11:30 AM');
  const [copiedText, setCopiedText] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Generate WhatsApp announcement text
  const generateBroadcastText = (session: MobileSession) => {
    return (
      `📢 *COMUNICADO OFICIAL — ${academy.name}*\n` +
      `⚽ *Categoría:* ${session.groupName}\n` +
      `📍 *Sede / Cancha:* ${session.court}\n\n` +
      `Estimados padres de familia:\n` +
      `Les informamos que la sesión de entrenamiento programada para hoy queda *SUSPENDIDA* debido a: *${session.cancelReason || cancelReason}*.\n\n` +
      `🗓️ *REPROGRAMACIÓN DE CLASE (RECUPERACIÓN):*\n` +
      `• *Nueva Fecha:* ${session.rescheduledToDate || rescheduledDate}\n` +
      `• *Horario:* ${session.rescheduledToTime || rescheduledTime}\n` +
      `• *Lugar:* ${session.court}\n\n` +
      `Ningún alumno perderá sus horas de entrenamiento reglamentarias. Agradecemos su comprensión y respaldo al deporte de nuestros campeones.`
    );
  };

  const handleConfirmCancellation = () => {
    if (!selectedSessionForCancel) return;

    const updated: MobileSession = {
      ...selectedSessionForCancel,
      isCancelled: true,
      cancelReason,
      rescheduledToDate: rescheduledDate,
      rescheduledToTime: rescheduledTime,
    };

    onUpdateSession(updated);
    setSelectedSessionForCancel(null);
    setFeedbackToast(`Clase "${updated.groupName}" suspendida. ¡Texto de WhatsApp listo para compartir!`);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleReactivateSession = (session: MobileSession) => {
    if (window.confirm(`¿Reactivar la clase de ${session.groupName}?`)) {
      const updated: MobileSession = {
        ...session,
        isCancelled: false,
        cancelReason: undefined,
        rescheduledToDate: undefined,
        rescheduledToTime: undefined,
      };
      onUpdateSession(updated);
      setFeedbackToast(`Clase de ${session.groupName} reactivada.`);
      setTimeout(() => setFeedbackToast(null), 3000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const shareViaWhatsApp = (session: MobileSession) => {
    const text = encodeURIComponent(generateBroadcastText(session));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="bg-emerald-950 border border-emerald-500 rounded-lg p-2.5 text-xs text-emerald-200 flex items-center justify-between">
          <span>{feedbackToast}</span>
          <button onClick={() => setFeedbackToast(null)} className="text-emerald-400 font-bold px-1">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase font-mono">
                Gestión de Clases & Avisos
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Control de sesiones de hoy, suspensión por imprevistos y reprogramaciones.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">
            {sessions.length} Turnos
          </span>
        </div>
      </div>

      {/* Sessions Cards */}
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`bg-slate-900 border rounded-xl p-3.5 transition shadow-sm ${
              session.isCancelled
                ? 'border-rose-500/50 bg-rose-950/20'
                : 'border-slate-800'
            }`}
          >
            {/* Header: Title & Status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">{session.groupName}</h3>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-400" />
                    {session.startTime} - {session.endTime}
                  </span>
                  <span>•</span>
                  <span>{session.court}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Profesor a cargo: <strong className="text-slate-300">{session.coachName}</strong>
                </div>
              </div>

              {session.isCancelled ? (
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase">
                  ⛔ SUSPENDIDA
                </span>
              ) : (
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                  PROGRAMADA OK
                </span>
              )}
            </div>

            {/* If Cancelled: Show Reason and Reschedule info */}
            {session.isCancelled && (
              <div className="mt-3 p-3 bg-slate-950/80 border border-rose-500/30 rounded-lg text-xs space-y-2 font-mono">
                <div className="flex items-start gap-1.5 text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <strong>Motivo de Suspensión:</strong> {session.cancelReason}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-slate-300 flex flex-col gap-1">
                  <span className="text-sky-400 font-bold text-[11px]">
                    🗓️ Clase Reprogramada para:
                  </span>
                  <div className="text-[11px] bg-slate-900 px-2 py-1 rounded border border-slate-800 text-white flex justify-between">
                    <span>Fecha: <strong>{session.rescheduledToDate}</strong></span>
                    <span>Hora: <strong>{session.rescheduledToTime}</strong></span>
                  </div>
                </div>

                {/* WhatsApp Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => shareViaWhatsApp(session)}
                    className="flex-1 py-1.5 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 text-[11px] transition shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Difundir en Grupo de Padres</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(generateBroadcastText(session))}
                    className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition"
                    title="Copiar texto"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReactivateSession(session)}
                    className="py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 transition"
                    title="Reactivar clase"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* If Not Cancelled: Button to Suspend */}
            {!session.isCancelled && (
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 font-mono">
                  Asistencia esperada: <strong>{session.totalStudents} alumnos</strong>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSessionForCancel(session)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-[11px] font-bold font-mono transition flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Suspender y Reprogramar</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for Suspending and Rescheduling */}
      {selectedSessionForCancel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 font-mono">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 space-y-3.5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-white uppercase">
                  Suspender Clase: {selectedSessionForCancel.groupName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSessionForCancel(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Reason selector & input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold block">
                Motivo de la Suspensión (Para los Padres):
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
              >
                <option value="Mantenimiento técnico y desinfección de campo sintético">
                  Mantenimiento o pintado de cancha deportiva
                </option>
                <option value="Cierre temporal del complejo deportivo por evento municipal">
                  Cierre de sede municipal / complejo deportivo
                </option>
                <option value="Condición climática desfavorable / Lluvia torrencial en campo">
                  Condición climática o lluvia intensa
                </option>
                <option value="Fuerza mayor / Reposo médico de emergencia del comando técnico">
                  Fuerza mayor o salud del entrenador
                </option>
                <option value="Feriado no laborable con reprogramación acordada">
                  Feriado no laborable
                </option>
              </select>
            </div>

            {/* Rescheduling fields */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold block">
                🗓️ Nueva Fecha de Reprogramación:
              </label>
              <input
                type="date"
                value={rescheduledDate}
                onChange={(e) => setRescheduledDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold block">
                ⏰ Horario de Recuperación:
              </label>
              <input
                type="text"
                value={rescheduledTime}
                onChange={(e) => setRescheduledTime(e.target.value)}
                placeholder="Ej. Sábado 10:00 AM - 11:30 AM"
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white font-mono"
              />
            </div>

            <p className="text-[10px] text-amber-300/90 leading-tight">
              Al confirmar, el estado cambiará a <strong>SUSPENDIDA</strong> y podrás enviar automáticamente el comunicado a tu grupo de WhatsApp en 1 toque.
            </p>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSessionForCancel(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Confirmar y Generar Aviso</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MobileSessionManagerView;
