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
import { triggerTopLoading } from './TopLoadingBar';

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
      <header className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            aria-label="Abrir menú"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              AD
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm tracking-tight leading-tight">Academia Deportiva</div>
              <div className="text-xs text-emerald-700 font-medium truncate max-w-[170px]">
                {activeAcademy.name}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {apiConnected ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              En Línea
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-rose-700 font-medium bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              Local
            </span>
          )}

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Vertical Container (Desktop Sticky + Mobile Slide-over Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Upper Sidebar: Branding + Tenant Switcher */}
        <div className="p-5 border-b border-slate-100">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                AD
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-base tracking-tight">Academia App</span>
                </div>
                <p className="text-xs text-slate-500 font-normal">Gestión Deportiva & SUNAT</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sede / Academy Multi-Tenant Selector */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {hasMultipleAcademies ? 'Sede Activa' : 'Sede Asignada'}
              </label>
              {!hasMultipleAcademies && (
                <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                  Principal
                </span>
              )}
            </div>

            {hasMultipleAcademies ? (
              <button
                onClick={() => setShowAcademyMenu(!showAcademyMenu)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">{activeAcademy.name}</div>
                    <div className="text-xs text-slate-500 font-mono">RUC: {activeAcademy.ruc || '20123456789'}</div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    showAcademyMenu ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>
            ) : (
              <div className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">{activeAcademy.name}</div>
                  <div className="text-xs text-slate-500 font-mono">RUC: {activeAcademy.ruc || '20123456789'}</div>
                </div>
              </div>
            )}

            {/* Dropdown Menu when multiple sedes exist */}
            {hasMultipleAcademies && showAcademyMenu && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-1 text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  Sedes Autorizadas
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {academiesList.map((acad) => {
                    const isCurrent = acad.id === activeAcademy.id;
                    return (
                      <button
                        key={acad.id}
                        onClick={() => {
                          triggerTopLoading(450);
                          onSelectAcademy(acad.id);
                          setShowAcademyMenu(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          isCurrent ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2">{acad.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold shrink-0">
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
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <div className="px-2 pt-1 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menú de Operaciones
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  setIsMobileOpen(false);
                  triggerTopLoading(350);
                }}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-left transition duration-150 group cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50/90 text-emerald-950 font-bold border border-emerald-200/80 shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:text-emerald-700 group-hover:bg-emerald-50'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm tracking-tight truncate flex items-center gap-1.5">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                                isActive
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-xs truncate ${
                            isActive ? 'text-emerald-800' : 'text-slate-500'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'text-emerald-700 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Lower Sidebar: SaaS Plan Banner, API Health & User Profile */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          {/* SaaS Plan Mini-Card */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Crown
                  className={`w-4 h-4 ${
                    subscription.plan.code === 'PRO' ? 'text-amber-500' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-slate-900">
                  {subscription.plan.name || 'Plan Pro'}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                {subscription.status === 'ACTIVE' ? 'ACTIVO' : 'TRIAL'}
              </span>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between mb-2">
              <span>Capacidad:</span>
              <span className="font-semibold text-slate-800">
                {subscription.limits.students ? `${subscription.limits.students} alumnos` : 'Ilimitado'}
              </span>
            </div>

            <button
              onClick={onOpenPlansModal}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ver Plan y Límites</span>
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate leading-tight">{userName}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {userRole}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Return to Super Admin Button if impersonating or superAdmin */}
          {isSuperAdmin && (
            <button
              onClick={() => {
                triggerTopLoading(350);
                if (onReturnToSuperAdmin) onReturnToSuperAdmin();
                navigate('/superadmin');
              }}
              className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-purple-600" />
              <span>Panel Maestro</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
