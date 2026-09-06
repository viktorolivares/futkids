import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  Sparkles,
  ChevronDown,
  UserCheck,
  Zap,
  Activity,
  Wifi,
  WifiOff,
  LogOut,
  Crown,
} from 'lucide-react';
import { WebTabType, SubscriptionStatusInfo, WebAcademyProfile } from '../types';
import { apiClient } from '../services/apiClient';

interface WebNavbarProps {
  currentTab: WebTabType;
  onSelectTab: (tab: WebTabType) => void;
  activeAcademy: WebAcademyProfile;
  academiesList: { id: string; name: string }[];
  onSelectAcademy: (id: string) => void;
  subscription: SubscriptionStatusInfo;
  onOpenPlansModal: () => void;
  userRole: string;
  onLogout: () => void;
  isSuperAdmin?: boolean;
  onReturnToSuperAdmin?: () => void;
}

export const WebNavbar: React.FC<WebNavbarProps> = ({
  currentTab,
  onSelectTab,
  activeAcademy,
  academiesList,
  onSelectAcademy,
  subscription,
  onOpenPlansModal,
  userRole,
  onLogout,
  isSuperAdmin,
  onReturnToSuperAdmin,
}) => {
  const [showAcademyMenu, setShowAcademyMenu] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .checkHealth()
      .then(() => {
        if (isMounted) setApiConnected(true);
      })
      .catch(() => {
        if (isMounted) setApiConnected(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeAcademy.id]);

  const navItems: { id: WebTabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Panel Operativo', icon: Activity },
    { id: 'students', label: 'Alumnos & Familias', icon: Users },
    { id: 'classes', label: 'Clases & Asistencia', icon: Calendar },
    { id: 'cashier', label: 'Caja & Pagos', icon: CreditCard },
    { id: 'billing', label: 'Facturación SUNAT', icon: FileText },
    { id: 'admin', label: 'Administración Sede', icon: Settings },
  ];

  return (
    <header className="bg-[#0D1117] border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Upper bar: Brand, Academy Selector, API status, User role */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Academy Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">
              AW
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm tracking-tight font-mono">academy-web</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-300 border border-slate-700 rounded">
                  v1.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
                Frontend SPA Desacoplado
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          {/* Sede Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAcademyMenu(!showAcademyMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#161B22] border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-200 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="max-w-[180px] sm:max-w-[240px] truncate font-semibold">
                {activeAcademy.name}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            {showAcademyMenu && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-[#161B22] border border-slate-700 rounded-lg shadow-xl py-1 z-50 font-mono text-xs">
                <div className="px-3 py-1.5 text-[10px] text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  Cambiar Sede (Multi-Tenant)
                </div>
                {academiesList.map((acad) => (
                  <button
                    key={acad.id}
                    onClick={() => {
                      onSelectAcademy(acad.id);
                      setShowAcademyMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition ${
                      acad.id === activeAcademy.id ? 'text-emerald-400 bg-emerald-500/5 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{acad.name}</span>
                    {acad.id === activeAcademy.id && <span className="text-[10px] text-emerald-400">Activo</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: API Status badge, Plan Pro, User Role */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* API Connection Indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#161B22] border border-slate-800 text-[11px] font-mono text-slate-300"
            title="Estado de conexión con academy-api (NestJS en http://localhost:3001/api/v1)"
          >
            {apiConnected === true ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300 font-semibold hidden md:inline">API Online</span>
              </>
            ) : apiConnected === false ? (
              <>
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span className="text-sky-300 font-semibold">Standalone Mode</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin"></span>
                <span className="text-slate-400">Verificando API...</span>
              </>
            )}
          </div>

          {/* SaaS Plan Pill */}
          <button
            onClick={onOpenPlansModal}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition border ${
              subscription.plan.code === 'PRO'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{subscription.plan.name}</span>
          </button>

          {/* User Role */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#161B22] border border-slate-800 text-[11px] font-mono text-slate-400">
            {isSuperAdmin ? (
              <Crown className="w-3 h-3 text-purple-400" />
            ) : (
              <UserCheck className="w-3 h-3 text-slate-400" />
            )}
            <span className={isSuperAdmin ? "text-purple-300 font-bold" : "text-slate-200 font-semibold"}>
              {userRole}
            </span>
          </div>

          {/* If Super Admin is viewing this tenant, button to return to Master Panel */}
          {isSuperAdmin && onReturnToSuperAdmin && (
            <button
              onClick={onReturnToSuperAdmin}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-950/40 border border-purple-500/40 text-[11px] font-mono text-purple-300 hover:bg-purple-900/50 transition cursor-pointer"
              title="Volver a la vista global de todas las academias"
            >
              <Crown className="w-3 h-3 text-purple-400" />
              <span>Panel Maestro</span>
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/20 hover:bg-rose-950/40 border border-rose-800/40 text-[11px] font-mono text-rose-300 transition cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-3 h-3 text-rose-400" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <nav className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto border-t border-slate-800/80">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition ${
                isActive
                  ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5 font-bold'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
