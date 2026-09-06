import React, { useState } from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  UserCheck,
  Search,
  Check,
  X,
  Sparkles,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { WebTrial } from '../types';

interface WebTrialsListProps {
  trials: WebTrial[];
  onConvertTrial: (trialId: string) => void;
  onAddTrial?: (trial: WebTrial) => void;
}

export const WebTrialsList: React.FC<WebTrialsListProps> = ({
  trials,
  onConvertTrial,
  onAddTrial,
}) => {
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONVERTED'>('ALL');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const pendingTrials = trials.filter((t) => !t.converted);
  const convertedTrials = trials.filter((t) => t.converted);
  const conversionRate = trials.length > 0 ? Math.round((convertedTrials.length / trials.length) * 100) : 0;

  const handleConvert = (trial: WebTrial) => {
    onConvertTrial(trial.id);
    setSuccessToast(`¡Excelente! ${trial.studentName} ha sido convertido a Alumno Regular.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const filteredTrials = trials.filter((t) => {
    const matchesText =
      t.studentName.toLowerCase().includes(filterText.toLowerCase()) ||
      t.guardianName.toLowerCase().includes(filterText.toLowerCase()) ||
      t.sport.toLowerCase().includes(filterText.toLowerCase());

    if (statusFilter === 'PENDING') return matchesText && !t.converted;
    if (statusFilter === 'CONVERTED') return matchesText && t.converted;
    return matchesText;
  });

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Clases de Prueba Agendadas</span>
            <Users className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400 mt-1">
            {trials.length}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {pendingTrials.length} pendientes de evaluación o asistencia
          </div>
        </div>

        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Alumnos Convertidos a Regular</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {convertedTrials.length}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Matriculados tras su clase de prueba
          </div>
        </div>

        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Tasa de Conversión</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {conversionRate}%
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Efectividad comercial de las clases de prueba
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded flex items-center gap-2 text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-xs uppercase tracking-wide">
              Registro de Clases de Prueba ({filteredTrials.length})
            </span>
            <div className="flex items-center gap-1 bg-[#161B22] p-0.5 rounded border border-slate-800 text-[10px]">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-0.5 rounded ${statusFilter === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2 py-0.5 rounded ${statusFilter === 'PENDING' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'}`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setStatusFilter('CONVERTED')}
                className={`px-2 py-0.5 rounded ${statusFilter === 'CONVERTED' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'}`}
              >
                Convertidos
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Buscar por alumno o apoderado..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-[#161B22] border border-slate-800 rounded pl-6 pr-2 py-1 text-[10px] text-slate-300 w-56"
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredTrials.map((trial) => (
            <div
              key={trial.id}
              className={`p-3 rounded border transition space-y-2 ${
                trial.converted
                  ? 'bg-[#161B22]/60 border-slate-800'
                  : 'bg-[#161B22] border-sky-500/30'
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">
                      {trial.studentName}
                    </span>
                    <span className="text-[9px] bg-slate-800 text-sky-400 px-1.5 py-0.2 rounded font-bold">
                      {trial.sport} • {trial.category}
                    </span>
                    {trial.converted ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>CONVERTIDO A REGULAR</span>
                      </span>
                    ) : (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                        EN EVALUACIÓN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-3">
                    <span>Apoderado: <strong className="text-slate-200">{trial.guardianName}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Phone className="w-2.5 h-2.5 text-slate-500" />
                      {trial.guardianPhone}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white">
                    {trial.isPaid ? (
                      <span className="text-emerald-400">S/ {trial.price.toFixed(2)} (Pagado)</span>
                    ) : (
                      <span className="text-slate-400">Gratuito</span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Fecha sesión: {trial.scheduledDate}
                  </div>
                </div>
              </div>

              {trial.notes && (
                <p className="text-[10px] text-slate-400 bg-[#0F1219] p-1.5 rounded border border-slate-800">
                  {trial.notes}
                </p>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] flex-wrap gap-2">
                <a
                  href={`https://wa.me/${trial.guardianPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Contactar por WhatsApp</span>
                </a>

                {!trial.converted && (
                  <button
                    onClick={() => handleConvert(trial)}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <UserCheck className="w-3 h-3 stroke-[3]" />
                    <span>Convertir a Alumno Regular</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
