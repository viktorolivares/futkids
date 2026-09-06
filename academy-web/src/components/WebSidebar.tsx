import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  Sparkles,
  ChevronDown,
  Activity,
  WifiOff,
  LogOut,
  Crown,
  Menu,
  X,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { SubscriptionStatusInfo, WebAcademyProfile } from '../types';
import { apiClient } from '../services/apiClient';

interface WebSidebarProps {
  activeAcademy: WebAcademyProfile;
  academiesList: { id: string; name: string }[];
  onSelectAcademy: (id: string) => void;
  subscription: SubscriptionStatusInfo;
  onOpenPlansModal: () => void;
  userRole: string;
  userName?: string;
  onLogout: () => void;
  isSuperAdmin?: boolean;
  onReturnToSuperAdmin?: () => void;
}

export const WebSidebar: React.FC<WebSidebarProps> = ({
  activeAcademy,
  academiesList,
  onSelectAcademy,
  subscription,
  onOpenPlansModal,
  userRole,
  userName = 'Administrador',
  onLogout,
  isSuperAdmin,
  onReturnToSuperAdmin,
}) => {
  const [showAcademyMenu, setShowAcademyMenu] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  const hasMultipleAcademies = academiesList && academiesList.length > 1;

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

    const interval = setInterval(() => {
      apiClient
        .checkHealth()
        .then(() => {
          if (isMounted) setApiConnected(true);
        })
        .catch(() => {
          if (isMounted) setApiConnected(false);
        });
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeAcademy.id]);

  const navItems = [
    {
      to: '/dashboard',
      label: 'Panel Operativo',
      description: 'Métricas, asistencias y cobros',
      icon: Activity,
    },
    {
      to: '/students',
      label: 'Alumnos & Familias',
      description: 'Padrón, becas y apoderados',
      icon: Users,
    },
    {
      to: '/classes',
      label: 'Clases & Asistencia',
      description: 'Grupos, aforos y toma de lista',
      icon: Calendar,
    },
    {
      to: '/cashier',
      label: 'Caja & Pagos',
      description: 'Cobranzas, deudas y arqueo',
      icon: CreditCard,
    },
    {
      to: '/billing',
      label: 'Facturación SUNAT',
      description: 'Boletas, facturas y notas',
      icon: FileText,
      badge: 'SUNAT',
    },
    {
      to: '/admin',
      label: 'Administración Sede',
      description: 'Deportes, tarifas y accesos',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Top App Bar (visible only on small screens < lg) */}
      <header className="lg:hidden bg-[#0D1117] border-b border-slate-800 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            aria-label="Abrir menú"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-sky-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-emerald-500/20">
              FK
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight leading-tight">GESTICLUB</div>
              <div className="text-[10px] text-emerald-400 font-mono truncate max-w-[170px]">
                {activeAcademy.name}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {apiConnected ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live DB
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Offline
            </span>
          )}

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60 transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Vertical Container (Desktop Sticky + Mobile Slide-over Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0D1117] border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Upper Sidebar: Branding + Tenant Switcher */}
        <div className="p-4 border-b border-slate-800/80">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
                FK
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-base tracking-tight">GESTICLUB</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded font-semibold">
                    v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Gestión Deportiva Multi-Sede</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sede / Academy Multi-Tenant Selector */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {hasMultipleAcademies ? 'Sede Activa (Conmutador)' : 'Sede Asignada'}
              </label>
              {!hasMultipleAcademies && (
                <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-mono">
                  Sede Única
                </span>
              )}
            </div>

            {hasMultipleAcademies ? (
              <button
                onClick={() => setShowAcademyMenu(!showAcademyMenu)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[#161B22] hover:bg-[#1C2128] border border-slate-700/80 hover:border-slate-500 text-left transition shadow-inner group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate">{activeAcademy.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">RUC: {activeAcademy.ruc || '20123456789'}</div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    showAcademyMenu ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>
            ) : (
              <div className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#161B22] border border-slate-800 text-left">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100 truncate">{activeAcademy.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">RUC: {activeAcademy.ruc || '20123456789'}</div>
                </div>
              </div>
            )}

            {/* Dropdown Menu when multiple sedes exist */}
            {hasMultipleAcademies && showAcademyMenu && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#161B22] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  Tus Sedes Autorizadas
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {academiesList.map((acad) => {
                    const isCurrent = acad.id === activeAcademy.id;
                    return (
                      <button
                        key={acad.id}
                        onClick={() => {
                          onSelectAcademy(acad.id);
                          setShowAcademyMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800/90 transition cursor-pointer ${
                          isCurrent ? 'bg-emerald-500/10 text-emerald-300 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <span className="truncate pr-2">{acad.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono shrink-0">
                            Activo
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Navigation Section */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menú Principal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-lg shadow-emerald-700/25 ring-1 ring-emerald-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800/80 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs tracking-tight truncate flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                                isActive
                                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-400/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isActive ? 'text-emerald-100/80 font-normal' : 'text-slate-400 group-hover:text-slate-300'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive ? 'text-white translate-x-0.5' : 'text-slate-400 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Lower Sidebar: SaaS Plan Banner, API Health & User Profile */}
        <div className="p-3 border-t border-slate-800/80 space-y-2.5 bg-[#0A0D12]">
          {/* SaaS Plan Mini-Card */}
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#161B22] to-[#1C2128] border border-slate-700/80">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Crown
                  className={`w-3.5 h-3.5 ${
                    subscription.plan.code === 'PRO' ? 'text-amber-400 animate-bounce' : 'text-slate-400'
                  }`}
                />
                <span className="text-[11px] font-bold text-white tracking-tight">
                  {subscription.plan.name || 'Plan PRO'}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {subscription.status === 'ACTIVE' ? 'ACTIVO' : 'TRIAL'}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between mb-2">
              <span>Alumnos:</span>
              <span className="font-semibold text-slate-200 font-mono">
                {subscription.limits.students ? `Límite ${subscription.limits.students}` : 'Ilimitado'}
              </span>
            </div>

            <button
              onClick={onOpenPlansModal}
              className="w-full py-1.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Gestionar Plan SaaS</span>
            </button>
          </div>

          {/* API Connection Indicator */}
          <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#161B22]/60 text-[10px] font-mono border border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-slate-400" />
              API NestJS:
            </span>
            {apiConnected === true ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Conectado (PostgreSQL)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <WifiOff className="w-3 h-3" />
                Desconectado
              </span>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-1 ring-sky-400/40 shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate leading-tight">{userName}</div>
                <div className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider truncate">
                  {userRole}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 transition cursor-pointer shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
            </button>
          </div>

          {/* Return to Super Admin Button if impersonating or superAdmin */}
          {isSuperAdmin && (
            <button
              onClick={() => {
                if (onReturnToSuperAdmin) onReturnToSuperAdmin();
                navigate('/superadmin');
              }}
              className="w-full py-1.5 px-2 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700/50 text-purple-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Crown className="w-3 h-3 text-amber-300" />
              <span>Volver a Panel Maestro</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
