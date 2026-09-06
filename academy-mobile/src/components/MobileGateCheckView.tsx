import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  CreditCard,
  MessageCircle,
  Phone,
  Heart,
  QrCode,
  User,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { MobileStudent, MobileAcademyProfile } from '../types';

interface MobileGateCheckViewProps {
  students: MobileStudent[];
  academy: MobileAcademyProfile;
  onGoToPayStudent: (student: MobileStudent) => void;
  onMarkAttendance: (studentId: string, status: 'PRESENT' | 'LATE') => void;
  currentSessionAttendance: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED'>;
}

export const MobileGateCheckView: React.FC<MobileGateCheckViewProps> = ({
  students,
  academy,
  onGoToPayStudent,
  onMarkAttendance,
  currentSessionAttendance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebt, setFilterDebt] = useState<'ALL' | 'UP_TO_DATE' | 'CURRENT_DUE' | 'CRITICAL_DEBT'>('ALL');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<MobileStudent | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.documentNumber.includes(searchTerm) ||
      s.parentName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterDebt === 'UP_TO_DATE') return s.balance === 0;
    if (filterDebt === 'CURRENT_DUE') return s.debtSeverity === 'CURRENT_DUE';
    if (filterDebt === 'CRITICAL_DEBT') return s.debtSeverity === 'CRITICAL_DEBT';
    return true;
  });

  // WhatsApp reminder generator
  const sendWhatsAppDebtReminder = (student: MobileStudent) => {
    const text = encodeURIComponent(
      `Hola estimado(a) ${student.parentName}, le saludamos de ${academy.name}.\n\n` +
      `Le informamos cordialmente que el alumno ${student.name} presenta un saldo pendiente de S/ ${student.balance.toFixed(2)} correspondiente a sus cuotas deportivas.\n\n` +
      `💳 Puede regularizar mediante:\n` +
      `• Yape / Plin: ${academy.yapeNumber} (A nombre de la Academia)\n\n` +
      `Por favor remitirnos la captura de la constancia por este medio. ¡Muchas gracias por su puntualidad y confianza!`
    );
    window.open(`https://wa.me/${student.parentPhone}?text=${text}`, '_blank');
  };

  const getTrafficLightStyle = (student: MobileStudent) => {
    if (student.balance === 0) {
      return {
        badge: '🟢 AL DÍA',
        badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        cardBorder: 'border-slate-800 hover:border-emerald-500/50',
        dotColor: 'bg-emerald-400',
        accessMsg: 'Acceso Directo Autorizado',
      };
    }
    if (student.debtSeverity === 'CURRENT_DUE') {
      return {
        badge: '🟡 CUOTA PENDIENTE',
        badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        cardBorder: 'border-amber-500/40 bg-amber-950/10',
        dotColor: 'bg-amber-400',
        accessMsg: 'Permitido entrenar (Aviso amable)',
      };
    }
    return {
      badge: '🔴 DEUDA CRÍTICA',
      badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      cardBorder: 'border-rose-500/60 bg-rose-950/20',
      dotColor: 'bg-rose-500',
      accessMsg: 'Requerido coordinar con Apoderado',
    };
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Filtro de Entrada y Semáforo de Deuda</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Validación rápida en la reja de cancha antes de iniciar la clase.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-500 block uppercase font-mono">Alumnos Hoy</span>
            <span className="text-xs font-bold text-white font-mono">{students.length} inscritos</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-2.5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por Nombre, DNI o Apoderado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
          <button
            onClick={() => setFilterDebt('ALL')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition cursor-pointer ${
              filterDebt === 'ALL'
                ? 'bg-emerald-500 text-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todos ({students.length})
          </button>
          <button
            onClick={() => setFilterDebt('UP_TO_DATE')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition cursor-pointer ${
              filterDebt === 'UP_TO_DATE'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            🟢 Al Día ({students.filter((s) => s.balance === 0).length})
          </button>
          <button
            onClick={() => setFilterDebt('CURRENT_DUE')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition cursor-pointer ${
              filterDebt === 'CURRENT_DUE'
                ? 'bg-amber-500 text-black'
                : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
            }`}
          >
            🟡 Cuota Mes ({students.filter((s) => s.debtSeverity === 'CURRENT_DUE').length})
          </button>
          <button
            onClick={() => setFilterDebt('CRITICAL_DEBT')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition cursor-pointer ${
              filterDebt === 'CRITICAL_DEBT'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
            }`}
          >
            🔴 Deuda Crítica ({students.filter((s) => s.debtSeverity === 'CRITICAL_DEBT').length})
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-2.5">
        {filteredStudents.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
            No se encontraron alumnos con el criterio seleccionado.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const tl = getTrafficLightStyle(student);
            const currentAttendance = currentSessionAttendance[student.id] || 'ABSENT';
            const isPresent = currentAttendance === 'PRESENT' || currentAttendance === 'LATE';

            return (
              <div
                key={student.id}
                className={`bg-slate-900 border rounded-xl p-3 transition shadow-sm ${tl.cardBorder}`}
              >
                {/* Upper line: Name + Traffic Light Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${tl.dotColor}`}></span>
                      <h3 className="font-bold text-white text-xs leading-snug">{student.name}</h3>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>DNI: {student.documentNumber}</span>
                      <span>•</span>
                      <span>{student.age} años</span>
                      <span>•</span>
                      <span className="text-sky-400">{student.groupName}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wide shrink-0 ${tl.badgeBg}`}
                  >
                    {tl.badge}
                  </span>
                </div>

                {/* Balance & Debt Info */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">SALDO PENDIENTE:</span>
                    <span
                      className={`font-black text-sm ${
                        student.balance === 0
                          ? 'text-emerald-400'
                          : student.debtSeverity === 'CURRENT_DUE'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      S/ {student.balance.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block">ESTADO EN CANCHA:</span>
                    {isPresent ? (
                      <span className="text-emerald-400 font-bold flex items-center justify-end gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>En Cancha ({currentAttendance})</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onMarkAttendance(student.id, 'PRESENT')}
                        className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold hover:bg-sky-500 hover:text-black transition"
                      >
                        + Marcar Ingreso
                      </button>
                    )}
                  </div>
                </div>

                {/* Medical alert banner if exists */}
                {student.medicalNotes && (
                  <div className="mt-2 px-2 py-1 bg-rose-950/40 border border-rose-500/30 rounded text-[10px] text-rose-300 flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">
                      <strong>Salud:</strong> {student.medicalNotes}
                    </span>
                  </div>
                )}

                {/* Action Buttons for Field Operations */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                  {/* Left: WhatsApp Reminder if has debt */}
                  {student.balance > 0 ? (
                    <button
                      type="button"
                      onClick={() => sendWhatsAppDebtReminder(student)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#161B22] hover:bg-slate-800 border border-slate-700 text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Recordar Deuda</span>
                    </button>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>Sin saldo por cobrar</span>
                    </div>
                  )}

                  {/* Right: Quick Pay Button */}
                  <button
                    type="button"
                    onClick={() => onGoToPayStudent(student)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Cobro Express Yape</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default MobileGateCheckView;
