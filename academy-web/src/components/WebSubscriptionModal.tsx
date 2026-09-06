import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
  AlertTriangle,
} from 'lucide-react';
import { SubscriptionStatusInfo } from '../types';

interface WebSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionStatusInfo;
  academyName?: string;
  onUpgradeToPro: () => void;
  onDowngradeToFree: () => void;
  onSimulateExpireTrial: () => void;
}

export const WebSubscriptionModal: React.FC<WebSubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onUpgradeToPro,
  onDowngradeToFree,
  onSimulateExpireTrial,
}) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'usage'>('comparison');

  if (!isOpen) return null;

  const isPro = subscription.plan.code === 'PRO';
  const isTrial = subscription.status === 'TRIALING';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0D1117] border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200">
        {/* Header Modal */}
        <div className="border-b border-slate-800 p-4 sm:p-6 flex items-start justify-between bg-[#161B22]/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold font-mono text-white">
                PLANES SAAS: MODELO FREE + PRO (14 DÍAS DE PRUEBA)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold">
                SaaS Multi-Tenant
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Prueba PRO de 14 días sin tarjeta para toda academia nueva. Conmutación automática a FREE sin pérdida de datos.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Subscription Status Bar */}
        <div className="p-4 bg-[#090D13] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Plan Actual:</span>
              <span className={`font-bold text-sm ${isPro ? 'text-amber-400' : 'text-slate-300'}`}>
                {subscription.plan.name} {isTrial ? '(Prueba 14 Días)' : ''}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Estado:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isTrial
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : isPro
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                }`}
              >
                {subscription.status}
              </span>
            </div>
            {isTrial && (
              <>
                <div className="h-6 w-px bg-slate-800"></div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Días Restantes:</span>
                  <span className="text-purple-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {subscription.trial.remainingDays} días
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isPro ? (
              <button
                onClick={onUpgradeToPro}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
              >
                <Zap className="w-3.5 h-3.5" /> Actualizar a PRO (S/ 99/mes)
              </button>
            ) : (
              <button
                onClick={onDowngradeToFree}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700 transition"
              >
                Cambiar a Plan FREE
              </button>
            )}

            {isTrial && (
              <button
                onClick={onSimulateExpireTrial}
                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-xs transition"
                title="Simula la finalización del día 14 y el auto-downgrade a FREE"
              >
                Simular Expiración (Día 14)
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* OverLimit Warning if applicable */}
          {subscription.overLimit && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3 text-xs font-mono text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-400 block mb-0.5">Límite de Alumnos Superado en Plan Free</strong>
                Tienes <strong>{subscription.usage.students} alumnos activos</strong> de un máximo de{' '}
                <strong>{subscription.limits.students || 30} permitidos</strong> en el plan gratuito. Todos tus alumnos
                existentes continúan activos y sus asistencias funcionan normalmente (Garantía de Cero Pérdida de Datos).
                Para matricular nuevos alumnos, actualiza a Pro.
              </div>
            </div>
          )}

          {/* Pricing Cards Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FREE PLAN CARD */}
            <div
              className={`rounded-xl p-5 border transition ${
                !isPro
                  ? 'border-sky-500/60 bg-sky-500/[0.03] shadow-lg shadow-sky-500/5'
                  : 'border-slate-800 bg-[#161B22]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  PLAN PERMANENTE
                </span>
                {!isPro && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded">
                    ACTIVO
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black font-mono text-white mb-1">Plan FREE</h3>
              <p className="text-xs text-slate-400 mb-4">
                Ideal para academias deportivas nacientes o escuelas pequeñas de hasta 30 alumnos.
              </p>

              <div className="mb-6 font-mono">
                <span className="text-3xl font-black text-white">S/ 0.00</span>
                <span className="text-xs text-slate-400 ml-1">/ mes para siempre</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono mb-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hasta <strong>30 alumnos activos</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hasta <strong>2 grupos o categorías</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>1 disciplina deportiva</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hasta 2 miembros del staff</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Control de asistencias y cobros manuales</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Sin Facturación Electrónica SUNAT</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Sin WhatsApp automático</span>
                </div>
              </div>

              {!isPro ? (
                <div className="w-full py-2 text-center text-xs font-mono text-slate-400 border border-slate-800 rounded bg-[#0D1117]">
                  Plan en uso actualmente
                </div>
              ) : (
                <button
                  onClick={onDowngradeToFree}
                  className="w-full py-2 text-center text-xs font-mono text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded bg-[#161B22] transition"
                >
                  Degradar a Plan Free
                </button>
              )}
            </div>

            {/* PRO PLAN CARD */}
            <div
              className={`rounded-xl p-5 border relative overflow-hidden transition ${
                isPro
                  ? 'border-amber-500/80 bg-amber-500/[0.04] shadow-xl shadow-amber-500/10'
                  : 'border-slate-700 bg-[#161B22]/70'
              }`}
            >
              {/* Popular / Pro Badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-black text-[9px] font-black font-mono px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                {isTrial ? '14 Días de Prueba' : 'Recomendado'}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> PLAN PRO ILIMITADO
                </span>
                {isPro && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                    {isTrial ? 'PRUEBA ACTIVA' : 'PLAN ACTIVO'}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black font-mono text-white mb-1">Plan PRO</h3>
              <p className="text-xs text-slate-400 mb-4">
                Control total sin límites para academias en aceleración o formalizadas.
              </p>

              <div className="mb-6 font-mono">
                <span className="text-3xl font-black text-amber-400">S/ 99.00</span>
                <span className="text-xs text-slate-400 ml-1">/ mes (facturación recurrente)</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono mb-6">
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span><strong>Alumnos ilimitados</strong> (sin tope)</span>
                </div>
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span><strong>Grupos y categorías ilimitadas</strong></span>
                </div>
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span><strong>Multideporte ilimitado</strong> (Fútbol, Básquet, Natación...)</span>
                </div>
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Hasta 10 usuarios del staff (Coaches, Cajeros, Admins)</span>
                </div>
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span><strong>Facturación Electrónica SUNAT</strong> (Boletas y Facturas directas UBL 2.1)</span>
                </div>
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Automatización de cobros vía WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 text-white font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Reportes financieros avanzados y exportación Excel/PDF</span>
                </div>
              </div>

              {!isPro ? (
                <button
                  onClick={onUpgradeToPro}
                  className="w-full py-2.5 text-center text-xs font-mono font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-lg shadow-lg shadow-amber-400/20 transition flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4" /> Desbloquear Plan PRO Ahora
                </button>
              ) : (
                <div className="w-full py-2.5 text-center text-xs font-mono font-bold text-amber-400 border border-amber-500/40 rounded-lg bg-amber-500/10 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Suscripción Pro Activa
                </div>
              )}
            </div>
          </div>

          {/* Usage & Limits Gauge Bar */}
          <div className="bg-[#090D13] border border-slate-800 rounded-xl p-4 font-mono">
            <h4 className="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Consumo Actual de Recursos de la Academia
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              {/* Students Metric */}
              <div className="p-3 bg-[#161B22] rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Alumnos Activos</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-black text-white">{subscription.usage.students}</span>
                  <span className="text-slate-400 text-[10px]">
                    / {subscription.limits.students === null ? 'Ilimitados' : `${subscription.limits.students} max`}
                  </span>
                </div>
                {subscription.limits.students && (
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        subscription.usage.students >= subscription.limits.students ? 'bg-rose-500' : 'bg-sky-400'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (subscription.usage.students / subscription.limits.students) * 100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Groups Metric */}
              <div className="p-3 bg-[#161B22] rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Grupos / Categorías</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-black text-white">{subscription.usage.groups}</span>
                  <span className="text-slate-400 text-[10px]">
                    / {subscription.limits.groups === null ? 'Ilimitados' : `${subscription.limits.groups} max`}
                  </span>
                </div>
              </div>

              {/* Sports Metric */}
              <div className="p-3 bg-[#161B22] rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Disciplinas</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-black text-white">{subscription.usage.sports}</span>
                  <span className="text-slate-400 text-[10px]">
                    / {subscription.limits.sports === null ? 'Ilimitados' : `${subscription.limits.sports} max`}
                  </span>
                </div>
              </div>

              {/* Users Metric */}
              <div className="p-3 bg-[#161B22] rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Staff / Miembros</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-black text-white">{subscription.usage.users}</span>
                  <span className="text-slate-400 text-[10px]">/ {subscription.limits.users || 2} max</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-[#090D13] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div>
            Garantía de Datos: Al descender de plan, ningún dato es eliminado ni ocultado.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
