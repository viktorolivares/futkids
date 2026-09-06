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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-800">
        {/* Header Modal */}
        <div className="border-b border-slate-100 p-6 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Planes y Límites de la Academia
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Multi-Sede
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Prueba Pro de 14 días sin tarjeta para toda academia nueva. Al finalizar, continúa en el Plan Free sin perder ningún dato.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Subscription Status Bar */}
        <div className="p-4 sm:p-6 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-400 text-xs uppercase block font-semibold">Plan Actual:</span>
              <span className="font-bold text-base text-slate-900">
                {subscription.plan.name} {isTrial ? '(Prueba 14 Días)' : ''}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <span className="text-slate-400 text-xs uppercase block font-semibold">Estado:</span>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase inline-block ${
                  isTrial
                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                    : isPro
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {subscription.status === 'TRIALING' ? 'Prueba Activa' : subscription.status === 'ACTIVE' ? 'Activo' : 'Vencido'}
              </span>
            </div>
            {isTrial && (
              <>
                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                <div>
                  <span className="text-slate-400 text-xs uppercase block font-semibold">Días Restantes:</span>
                  <span className="text-purple-700 font-bold text-base flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {subscription.trial.remainingDays} días
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
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Zap className="w-4 h-4" /> Actualizar a Pro (S/ 99/mes)
              </button>
            ) : (
              <button
                onClick={onDowngradeToFree}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cambiar a Plan Free
              </button>
            )}

            {isTrial && (
              <button
                onClick={onSimulateExpireTrial}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium transition cursor-pointer"
                title="Simula la finalización del día 14 y el auto-downgrade a Free"
              >
                Simular Fin de Prueba
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* OverLimit Warning if applicable */}
          {subscription.overLimit && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-900 block mb-0.5 font-bold">Límite de Alumnos Superado en Plan Free</strong>
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
              className={`rounded-2xl p-6 border transition ${
                !isPro
                  ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Plan Gratuito Permanente
                </span>
                {!isPro && (
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                    ACTIVO
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">Plan Free</h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-4">
                Ideal para escuelas deportivas formativas de hasta 30 alumnos.
              </p>

              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">S/ 0.00</span>
                <span className="text-xs sm:text-sm text-slate-500 ml-1">/ para siempre</span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm mb-6">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hasta <strong>30 alumnos activos</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hasta <strong>2 grupos o categorías</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>1 disciplina deportiva</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Control de asistencias y cobros</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-400">
                  <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Sin Facturación Electrónica SUNAT</span>
                </div>
              </div>

              {!isPro ? (
                <div className="w-full py-2.5 text-center text-xs sm:text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl bg-slate-50">
                  Plan en uso actualmente
                </div>
              ) : (
                <button
                  onClick={onDowngradeToFree}
                  className="w-full py-2.5 text-center text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  Degradar a Plan Free
                </button>
              )}
            </div>

            {/* PRO PLAN CARD */}
            <div
              className={`rounded-2xl p-6 border relative transition ${
                isPro
                  ? 'border-emerald-500 bg-emerald-50/30 shadow-xs'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <Zap className="w-4 h-4" /> Plan Pro Ilimitado
                </span>
                {isPro && (
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                    {isTrial ? 'PRUEBA ACTIVA' : 'PLAN ACTIVO'}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">Plan Pro</h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-4">
                Control total sin límites para academias formales y clubes en crecimiento.
              </p>

              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">S/ 99.00</span>
                <span className="text-xs sm:text-sm text-slate-500 ml-1">/ mes</span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm mb-6">
                <div className="flex items-center gap-2.5 text-slate-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Alumnos ilimitados</strong> (sin tope)</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Grupos y categorías ilimitadas</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Multideporte</strong> (Fútbol, Básquet, Vóley...)</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Facturación Electrónica SUNAT</strong> (Boletas y Facturas directas)</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cobranzas y avisos por WhatsApp</span>
                </div>
              </div>

              {!isPro ? (
                <button
                  onClick={onUpgradeToPro}
                  className="w-full py-3 text-center text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Zap className="w-4 h-4 text-amber-300" /> Activar Plan Pro
                </button>
              ) : (
                <div className="w-full py-3 text-center text-xs sm:text-sm font-bold text-emerald-900 border border-emerald-200 rounded-xl bg-emerald-50 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Suscripción Pro Activa
                </div>
              )}
            </div>
          </div>

          {/* Usage & Limits Gauge Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Consumo Actual de Recursos de la Sede
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-xs block uppercase font-semibold">Alumnos Activos</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900">{subscription.usage.students}</span>
                  <span className="text-slate-500 text-xs">
                    / {subscription.limits.students === null ? 'Ilimitados' : `${subscription.limits.students}`}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-xs block uppercase font-semibold">Grupos</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900">{subscription.usage.groups}</span>
                  <span className="text-slate-500 text-xs">
                    / {subscription.limits.groups === null ? 'Ilimitados' : `${subscription.limits.groups}`}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-xs block uppercase font-semibold">Disciplinas</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900">{subscription.usage.sports}</span>
                  <span className="text-slate-500 text-xs">
                    / {subscription.limits.sports === null ? 'Ilimitados' : `${subscription.limits.sports}`}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-xs block uppercase font-semibold">Staff</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900">{subscription.usage.users}</span>
                  <span className="text-slate-500 text-xs">/ {subscription.limits.users || 2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Garantía de Datos: Al descender de plan, ningún dato es eliminado ni ocultado.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
