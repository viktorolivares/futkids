import React from 'react';
import {
  Building2,
  User,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import { DemoUser, SubscriptionStatusInfo, AppMode } from '../types';
import { DEMO_USERS, DEMO_ACADEMIES } from '../data/mockApiData';

interface HeaderProps {
  currentUser: DemoUser;
  onSelectUser: (user: DemoUser) => void;
  activeAcademyId: string;
  onSelectAcademy: (academyId: string) => void;
  systemHealthy: boolean;
  onOpenQuickHealth: () => void;
  subscription?: SubscriptionStatusInfo;
  onOpenPlansModal?: () => void;
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  activeAcademyId,
  onSelectAcademy,
  systemHealthy,
  onOpenQuickHealth,
  subscription,
  onOpenPlansModal,
  currentMode,
  onSelectMode,
}) => {
  const currentMembership = currentUser.memberships.find(
    (m) => m.academyId === activeAcademyId,
  );
  const activeAcademy = DEMO_ACADEMIES.find((a) => a.id === activeAcademyId);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
      {/* Top Reassurance Strip - Clean, reassuring and calm */}
      <div className="bg-slate-50/80 border-b border-slate-200/60 px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sistema Operativo y Seguro</span>
          </div>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 hidden sm:inline">Moneda: Soles (S/) • Conexión SUNAT UBL 2.1 Lista</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenQuickHealth}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer shadow-2xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ver Estado de Servidores</span>
          </button>
        </div>
      </div>

      {/* Main Peaceful Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
            AD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Academia Deportiva
              </h1>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200/70">
                Perú
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Plataforma Integral de Gestión y Entrenamiento
            </p>
          </div>
        </div>

        {/* Primary View Switcher Tabs - Spacious & Relaxed */}
        <nav className="flex items-center bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/70 text-sm font-medium">
          <button
            onClick={() => onSelectMode('clients-admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm cursor-pointer ${
              currentMode === 'clients-admin'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Mis Academias</span>
          </button>

          <button
            onClick={() => onSelectMode('mobile-field')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm cursor-pointer ${
              currentMode === 'mobile-field'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>App Móvil de Campo</span>
          </button>

          <button
            onClick={() => onSelectMode('api-sandbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm cursor-pointer ${
              currentMode === 'api-sandbox'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-600" />
            <span>Herramientas & SUNAT</span>
          </button>
        </nav>

        {/* Tenant & User Context - Clean, legible and calm */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Active Academy Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-left">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Sede Activa
              </div>
              <select
                value={activeAcademyId}
                onChange={(e) => onSelectAcademy(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                {DEMO_ACADEMIES.map((acad) => (
                  <option key={acad.id} value={acad.id} className="text-slate-800 bg-white">
                    {acad.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Profile Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <User className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="text-left">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Usuario
              </div>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const u = DEMO_USERS.find((usr) => usr.id === e.target.value);
                  if (u) {
                    onSelectUser(u);
                    if (u.memberships[0]) {
                      onSelectAcademy(u.memberships[0].academyId);
                    }
                  }
                }}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {DEMO_USERS.map((usr) => (
                  <option key={usr.id} value={usr.id} className="text-slate-800 bg-white">
                    {usr.name} ({usr.roleLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SaaS Plan Badge */}
          {subscription && (
            <button
              onClick={onOpenPlansModal}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${
                subscription.status === 'TRIALING'
                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                  : subscription.plan.code === 'PRO'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="Gestionar Plan y Suscripción"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Plan {subscription.plan.code}</span>
              {subscription.status === 'TRIALING' && (
                <span className="text-purple-600 font-normal">
                  ({subscription.trial.remainingDays}d de prueba)
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

