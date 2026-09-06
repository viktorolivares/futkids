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
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-xs sm:text-sm text-purple-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            14 DÍAS DE PRUEBA PRO
          </span>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              Te quedan <strong className="font-bold text-purple-900">{subscription.trial.remainingDays} días de prueba</strong> con Facturación SUNAT y alumnos ilimitados.
            </span>
          </div>
        </div>

        <button
          onClick={onOpenPlansModal}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
        >
          <Zap className="w-3.5 h-3.5" /> Ver Planes y Activar Pro <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (!isPro && subscription.overLimit) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Plan Free (Límite Superado):</strong> Tienes {subscription.usage.students} alumnos activos (máximo 30).
            Tus clases siguen 100% operativas. Actualiza a Pro para matricular nuevos alumnos.
          </span>
        </div>

        <button
          onClick={onOpenPlansModal}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
        >
          <Zap className="w-3.5 h-3.5" /> Actualizar a PRO (S/ 99/mes)
        </button>
      </div>
    );
  }

  if (!isPro) {
    const studentsRemaining = Math.max(0, (subscription.limits.students || 30) - subscription.usage.students);
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold uppercase text-xs">Plan Actual:</span>
          <span className="text-slate-900 font-bold">Free</span>
          <span className="text-slate-300">•</span>
          <span>
            Alumnos: <strong className="text-emerald-700">{subscription.usage.students} / {subscription.limits.students || 30}</strong> ({studentsRemaining} cupos disponibles)
          </span>
        </div>

        <button
          onClick={onOpenPlansModal}
          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" /> Desbloquear alumnos ilimitados y SUNAT
        </button>
      </div>
    );
  }

  return null;
};
