import React from 'react';
import {
  X,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  Phone,
} from 'lucide-react';
import { MobileStudent, MobileSession, MobileAcademyProfile, MobilePaymentRecord } from '../types';

interface MobileQuickStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  academy: MobileAcademyProfile;
  students: MobileStudent[];
  sessions: MobileSession[];
  payments: MobilePaymentRecord[];
}

export const MobileQuickStatsModal: React.FC<MobileQuickStatsModalProps> = ({
  isOpen,
  onClose,
  academy,
  students,
  sessions,
  payments,
}) => {
  if (!isOpen) return null;

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const upToDateCount = students.filter((s) => s.balance === 0).length;
  const currentDueCount = students.filter((s) => s.debtSeverity === 'CURRENT_DUE').length;
  const criticalDebtCount = students.filter((s) => s.debtSeverity === 'CRITICAL_DEBT').length;
  const totalDebtAmount = students.reduce((acc, s) => acc + s.balance, 0);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-3 font-mono text-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-4 space-y-3.5 shadow-2xl animate-fade-in text-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white uppercase text-xs">
              Resumen Operativo de Hoy
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cash Summary */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase font-bold block">
            TOTAL COBRADO EN CAMPO HOY:
          </span>
          <div className="text-xl font-black text-white">
            S/ {totalCollected.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-300">
            {payments.length} transacciones registradas (Yape / Plin / Efectivo)
          </div>
        </div>

        {/* Debt and Students breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-emerald-400 block font-bold">AL DÍA</span>
            <span className="text-sm font-black text-white mt-0.5 block">{upToDateCount}</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-amber-400 block font-bold">CUOTA MES</span>
            <span className="text-sm font-black text-white mt-0.5 block">{currentDueCount}</span>
          </div>
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-rose-400 block font-bold">CRÍTICO</span>
            <span className="text-sm font-black text-white mt-0.5 block">{criticalDebtCount}</span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Deuda Acumulada:</span>
            <span className="text-rose-400 font-bold">S/ {totalDebtAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Turnos Programados:</span>
            <span className="text-white font-bold">{sessions.length} clases</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Yape Oficial Academia:</span>
            <span className="text-sky-400 font-bold">{academy.yapeNumber}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
        >
          Cerrar Resumen
        </button>
      </div>
    </div>
  );
};
export default MobileQuickStatsModal;
