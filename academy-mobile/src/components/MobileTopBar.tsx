import React from 'react';
import {
  Shield,
  Clock,
  Wifi,
  MapPin,
  Sparkles,
  PhoneCall,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { MobileAcademyProfile } from '../types';

interface MobileTopBarProps {
  academy: MobileAcademyProfile;
  activeShift: string;
  totalCollectedToday: number;
  criticalDebtCount: number;
  onOpenQuickStats: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  academy,
  activeShift,
  totalCollectedToday,
  criticalDebtCount,
  onOpenQuickStats,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 px-3 py-2.5 sticky top-0 z-30 shadow-md">
      {/* Upper Status Line */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className="font-semibold text-white truncate">{academy.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>EN CAMPO</span>
          </span>
          <button
            type="button"
            onClick={onOpenQuickStats}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
            title="Ver resumen del día"
          >
            <DollarSign className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Info Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-sm">
            ⚽
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{academy.currentCourt}</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>{activeShift}</span>
            </div>
          </div>
        </div>

        {/* Quick KPI badges */}
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <div
            onClick={onOpenQuickStats}
            className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-2 py-1 rounded cursor-pointer text-right"
          >
            <span className="text-[8px] text-emerald-500 block uppercase">Caja Hoy</span>
            <span className="font-bold text-xs">S/ {totalCollectedToday.toFixed(2)}</span>
          </div>

          {criticalDebtCount > 0 && (
            <div
              onClick={onOpenQuickStats}
              className="bg-rose-950/70 border border-rose-500/40 text-rose-300 px-2 py-1 rounded cursor-pointer text-right"
              title="Alumnos con deuda crítica"
            >
              <span className="text-[8px] text-rose-500 block uppercase">Alerta Deuda</span>
              <span className="font-bold text-xs flex items-center justify-end gap-0.5">
                <AlertCircle className="w-3 h-3 text-rose-400" />
                {criticalDebtCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default MobileTopBar;
