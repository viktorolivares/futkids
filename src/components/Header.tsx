import React from 'react';
import {
  ShieldCheck,
  Building2,
  User,
  Activity,
  CheckCircle2,
  Layers,
  Database,
  Terminal,
  Smartphone,
} from 'lucide-react';
import { DemoUser, SubscriptionStatusInfo, AppMode } from '../types';
import { DEMO_USERS, DEMO_ACADEMIES } from '../data/mockApiData';
import { Sparkles } from 'lucide-react';

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
    <header className="bg-[#0F1219] border-b border-slate-800 text-slate-300 sticky top-0 z-50">
      {/* Top Telemetry Strip - High Density Console */}
      <div className="bg-[#090B10] px-3 py-1.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API: NESTJS V10 (MODULAR MONOLITH)</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Database className="w-3 h-3 text-sky-400" />
            <span className="text-slate-500 uppercase">PG16:</span>
            <span className="text-emerald-400 font-semibold">ONLINE (PRISMA)</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3 h-3 text-rose-400" />
            <span className="text-slate-500 uppercase">REDIS:</span>
            <span className="text-emerald-400 font-semibold">PONG (6379)</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Layers className="w-3 h-3 text-amber-400" />
            <span className="text-slate-500 uppercase">BULLMQ:</span>
            <span className="text-amber-300 font-semibold">6 QUEUES ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <div className="hidden lg:flex items-center gap-2 text-slate-500">
            <span>LOC: PE-LIM (-12.0464° S, 77.0428° W)</span>
            <span>•</span>
            <span className="text-slate-300">CUR: PEN (S/)</span>
          </div>
          <button
            onClick={onOpenQuickHealth}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161B22] hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition"
          >
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="uppercase tracking-wider">GET /api/v1/health</span>
          </button>
        </div>
      </div>

      {/* Main Header Console Bar */}
      <div className="max-w-7xl mx-auto px-3 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-sky-500 rounded flex items-center justify-center text-[#0B0E14] font-black text-xs italic tracking-tighter">
            AP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold tracking-tight text-white uppercase font-mono">
                ACADEMY PLATFORM
              </h1>
              <span className="bg-sky-500/10 text-sky-400 text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border border-sky-500/30 uppercase">
                PERÚ
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              MULTI-TENANT • SUNAT UBL 2.1 • SAAS FREE/PRO
            </p>
          </div>

          {/* Dedicated Sandbox Mode Switcher: clients-admin vs api-sandbox */}
          <div className="hidden sm:flex items-center bg-[#090B10] p-1 rounded border border-slate-800 font-mono text-[10px] ml-2">
            <button
              onClick={() => onSelectMode('clients-admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold uppercase transition ${
                currentMode === 'clients-admin'
                  ? 'bg-sky-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Mis Clientes (SaaS Admin)</span>
            </button>
            <button
              onClick={() => onSelectMode('api-sandbox')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold uppercase transition ${
                currentMode === 'api-sandbox'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>API Sandbox & SUNAT</span>
            </button>
            <button
              onClick={() => onSelectMode('mobile-field')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold uppercase transition ${
                currentMode === 'mobile-field'
                  ? 'bg-emerald-400 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>App Móvil (APK Campo)</span>
            </button>
          </div>
        </div>

        {/* Tenant & User Switcher Controls (Compact Density) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* User Profile Switcher */}
          <div className="flex items-center gap-2 bg-[#090B10] px-2.5 py-1 rounded border border-slate-800">
            <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-semibold">
                AUTH USER (JWT)
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
                className="bg-transparent text-[11px] font-mono text-white focus:outline-none cursor-pointer"
              >
                {DEMO_USERS.map((usr) => (
                  <option key={usr.id} value={usr.id} className="bg-[#0F1219] text-white font-mono">
                    {usr.name} — {usr.roleLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Tenant Context Switcher */}
          <div className="flex items-center gap-2 bg-[#090B10] px-2.5 py-1 rounded border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-semibold">
                TENANT CONTEXT (x-academy-id)
              </div>
              <select
                value={activeAcademyId}
                onChange={(e) => onSelectAcademy(e.target.value)}
                className="bg-transparent text-[11px] font-mono text-amber-300 focus:outline-none cursor-pointer max-w-[240px] truncate"
              >
                {DEMO_ACADEMIES.map((acad) => {
                  const isMember = currentUser.memberships.some((m) => m.academyId === acad.id);
                  return (
                    <option
                      key={acad.id}
                      value={acad.id}
                      className="bg-[#0F1219] text-white font-mono"
                    >
                      {acad.name} {isMember ? '• [MEMBERSHIP ACTIVE]' : '• [NO ACCESS - 403]'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Role Badge in Current Tenant */}
          <div className="px-2 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 border border-slate-800 bg-[#090B10]">
            <span className="text-slate-500 text-[9px] uppercase">ROL:</span>
            {currentMembership ? (
              <span className="text-emerald-400">{currentMembership.role}</span>
            ) : (
              <span className="text-rose-400">UNAUTHORIZED</span>
            )}
          </div>

          {/* SaaS Plan / Trial Badge */}
          {subscription && (
            <button
              onClick={onOpenPlansModal}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                subscription.status === 'TRIALING'
                  ? 'bg-purple-950/60 border-purple-500/40 text-purple-300 hover:bg-purple-900/60'
                  : subscription.plan.code === 'PRO'
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Gestionar Plan y Suscripción SaaS"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>PLAN:</span>
              <span className="uppercase text-white">
                {subscription.plan.code}
                {subscription.status === 'TRIALING' && ` (${subscription.trial.remainingDays}d)`}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
