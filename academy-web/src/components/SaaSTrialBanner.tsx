import React from 'react';
import { Sparkles, Clock, AlertTriangle, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { SubscriptionStatusInfo } from '../types';

interface SaaSTrialBannerProps {
  subscription: SubscriptionStatusInfo;
  onOpenPlansModal: () => void;
}

export const SaaSTrialBanner: React.FC<SaaSTrialBannerProps> = ({
  subscription,
  onOpenPlansModal,
}) => {
  const isTrial = subscription.status === 'TRIALING';
  const isPro = subscription.plan.code === 'PRO';

  if (isTrial) {
    return (
      <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-slate-900 border-b border-purple-500/30 px-4 py-2 text-xs font-mono text-purple-200 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-purple-400" />
            14 DÍAS DE PRUEBA PRO
          </span>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>
              Te quedan <strong className="text-white">{subscription.trial.remainingDays} días de prueba</strong>.
              Disfrutas de <strong>Facturación SUNAT</strong>, <strong>WhatsApp</strong> y{' '}
              <strong>Alumnos Ilimitados</strong> sin costo.
            </span>
          </div>
        </div>

        <button
          onClick={onOpenPlansModal}
          className="px-3 py-1 bg-purple-500 hover:bg-purple-400 text-black font-bold rounded text-[11px] flex items-center gap-1.5 transition shadow-sm"
        >
          <Zap className="w-3 h-3" /> Ver Planes y Activar Pro <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (!isPro && subscription.overLimit) {
    return (
      <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 text-xs font-mono text-amber-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Plan FREE (Límite Superado):</strong> Tienes {subscription.usage.students} alumnos activos (máximo 30).
            Tus clases y datos siguen 100% operativos. Actualiza a Pro para matricular nuevos alumnos.
          </span>
        </div>

        <button
          onClick={onOpenPlansModal}
          className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded text-[11px] flex items-center gap-1 transition shadow-sm"
        >
          <Zap className="w-3 h-3" /> Actualizar a PRO (S/ 99/mes)
        </button>
      </div>
    );
  }

  if (!isPro) {
    const studentsRemaining = Math.max(0, (subscription.limits.students || 30) - subscription.usage.students);
    return (
      <div className="bg-[#0B1017] border-b border-slate-800 px-4 py-1.5 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 uppercase text-[10px]">PLAN PERMANENTE:</span>
          <span className="text-slate-200 font-bold">FREE (S/ 0.00)</span>
          <span className="text-slate-600">•</span>
          <span>
            Alumnos: <strong className="text-sky-400">{subscription.usage.students} / {subscription.limits.students || 30}</strong> ({studentsRemaining} cupos restantes)
          </span>
        </div>

        <button
          onClick={onOpenPlansModal}
          className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1 font-semibold"
        >
          <Zap className="w-3 h-3" /> Desbloquear alumnos ilimitados y SUNAT
        </button>
      </div>
    );
  }

  return null;
};
