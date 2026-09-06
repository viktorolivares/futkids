import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Activity,
  Crown,
} from 'lucide-react';
import { DemoUser } from '../types';

interface LoginPageProps {
  onLogin: (user: DemoUser) => void;
}

// Pre-configured demo credentials for testing all roles
const DEMO_ACCOUNTS: Array<{
  id: string;
  email: string;
  passwordHint: string;
  name: string;
  roleLabel: string;
  isSuperAdmin: boolean;
  academyName?: string;
  academyId?: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'COACH' | 'CASHIER';
  badgeColor: string;
  description: string;
}> = [
  {
    id: 'usr-superadmin',
    email: 'superadmin@plataforma-academy.pe',
    passwordHint: 'Admin1234!',
    name: 'Viktor Olivares',
    roleLabel: 'SUPER ADMIN MAESTRO',
    isSuperAdmin: true,
    role: 'SUPER_ADMIN',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Gestión global de todas las academias clientes, MRR, planes SaaS y trials.',
  },
  {
    id: 'usr-carlos-alianza',
    email: 'carlos.mendoza@alianzalima.pe',
    passwordHint: 'Alianza2026!',
    name: 'Carlos Mendoza',
    roleLabel: 'DIRECTOR / OWNER',
    isSuperAdmin: false,
    academyId: 'acad-alianza-01',
    academyName: 'Academia Alianza Lima - Sede Matute',
    role: 'OWNER',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    description: 'Acceso total a la Sede Matute (420 alumnos, caja, clases, facturación SUNAT).',
  },
  {
    id: 'usr-palacios-cristal',
    email: 'formativas@sportingcristal.pe',
    passwordHint: 'Cristal2026!',
    name: 'Roberto Palacios',
    roleLabel: 'COORDINADOR / ADMIN',
    isSuperAdmin: false,
    academyId: 'acad-cristal-02',
    academyName: 'Sporting Cristal Academy - Rímac',
    role: 'ADMIN',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Gestión formativa de Sporting Cristal (310 alumnos, grupos y asistencias).',
  },
  {
    id: 'usr-cajero-cantolao',
    email: 'caja@cantolao.pe',
    passwordHint: 'Cantolao2026!',
    name: 'Kiko Mandriotti',
    roleLabel: 'CAJERO / COBRANZAS',
    isSuperAdmin: false,
    academyId: 'acad-cantolao-04',
    academyName: 'Academia Cantolao - Sede Callao',
    role: 'CASHIER',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Cobranza y emisión de comprobantes en Academia Cantolao (Plan Free).',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('superadmin@plataforma-academy.pe');
  const [password, setPassword] = useState('Admin1234!');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Check if credentials match any demo account
      const matched = DEMO_ACCOUNTS.find(
        (acc) => acc.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (matched) {
        const loggedUser: DemoUser = {
          id: matched.id,
          name: matched.name,
          email: matched.email,
          roleLabel: matched.roleLabel,
          isSuperAdmin: matched.isSuperAdmin,
          role: matched.role,
          memberships: matched.isSuperAdmin
            ? []
            : [
                {
                  academyId: matched.academyId || 'acad-alianza-01',
                  academyName: matched.academyName || 'Academia Alianza Lima',
                  role: matched.role,
                  isDefault: true,
                },
              ],
        };

        // Persist session locally
        localStorage.setItem('academy_auth_user', JSON.stringify(loggedUser));
        onLogin(loggedUser);
      } else {
        // Fallback for custom emails
        if (email.includes('super') || email.includes('admin@plataforma')) {
          const superAdminUser: DemoUser = {
            id: 'usr-custom-super',
            name: email.split('@')[0],
            email,
            roleLabel: 'SUPER ADMIN MAESTRO',
            isSuperAdmin: true,
            role: 'SUPER_ADMIN',
            memberships: [],
          };
          localStorage.setItem('academy_auth_user', JSON.stringify(superAdminUser));
          onLogin(superAdminUser);
        } else {
          const tenantUser: DemoUser = {
            id: 'usr-custom-tenant',
            name: email.split('@')[0],
            email,
            roleLabel: 'ADMINISTRADOR DE ACADEMIA',
            isSuperAdmin: false,
            role: 'ADMIN',
            memberships: [
              {
                academyId: 'acad-alianza-01',
                academyName: 'Academia Alianza Lima - Sede Matute',
                role: 'ADMIN',
                isDefault: true,
              },
            ],
          };
          localStorage.setItem('academy_auth_user', JSON.stringify(tenantUser));
          onLogin(tenantUser);
        }
      }
    }, 450);
  };

  const handleQuickLogin = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(demo.email);
    setPassword(demo.passwordHint);
    setErrorMessage(null);

    const loggedUser: DemoUser = {
      id: demo.id,
      name: demo.name,
      email: demo.email,
      roleLabel: demo.roleLabel,
      isSuperAdmin: demo.isSuperAdmin,
      role: demo.role,
      memberships: demo.isSuperAdmin
        ? []
        : [
            {
              academyId: demo.academyId || 'acad-alianza-01',
              academyName: demo.academyName || 'Academia Alianza Lima',
              role: demo.role,
              isDefault: true,
            },
          ],
    };

    localStorage.setItem('academy_auth_user', JSON.stringify(loggedUser));
    onLogin(loggedUser);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Brand Bar */}
      <header className="border-b border-slate-800 bg-[#161B22]/90 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">ACADEMY PLATFORM</span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Perú SaaS Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sistema Integral para Academias Deportivas • Facturación SUNAT UBL 2.1
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Aislamiento RLS PostgreSQL</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>JWT & Role-Based Security</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Login Form */}
          <div className="lg:col-span-6 bg-[#161B22] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold mb-3">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Portal Unificado de Autenticación</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Iniciar Sesión
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Ingresa con tu cuenta de <strong>Super Admin</strong> o tus credenciales de <strong>Academia</strong>.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ej. director@alianzalima.pe o admin@plataforma.pe"
                      className="w-full bg-[#0D1117] border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Contraseña
                    </label>
                    <span className="text-[11px] text-sky-400 hover:underline cursor-pointer">
                      ¿Olvidaste tu contraseña?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#0D1117] border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded bg-[#0D1117] border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Recordar sesión en este equipo</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Entrar a la Plataforma</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Security Guarantee */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Cifrado SSL/TLS 256 bits • Autenticación segura con firma criptográfica JWT.
              </span>
            </div>
          </div>

          {/* Right Column: Role Demonstration & Quick Access */}
          <div className="lg:col-span-6 bg-[#161B22]/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Acceso Rápido por Roles</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Selecciona una cuenta para probar instantáneamente la segmentación por roles:
                  </p>
                </div>
              </div>

              {/* Demo Accounts List */}
              <div className="space-y-2.5">
                {DEMO_ACCOUNTS.map((demo) => {
                  const isSuper = demo.isSuperAdmin;
                  return (
                    <div
                      key={demo.id}
                      onClick={() => handleQuickLogin(demo)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                        isSuper
                          ? 'bg-purple-950/20 border-purple-500/40 hover:bg-purple-950/40 hover:border-purple-500/60'
                          : 'bg-[#0D1117]/80 border-slate-800 hover:border-slate-700 hover:bg-[#0D1117]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {isSuper ? (
                            <Crown className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Building2 className="w-4 h-4 text-sky-400" />
                          )}
                          <span className="text-sm font-bold text-white">{demo.name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${demo.badgeColor}`}>
                          {demo.roleLabel}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mb-1.5">
                        <span className="text-slate-300">{demo.email}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-500">{demo.passwordHint}</span>
                      </div>

                      {demo.academyName && (
                        <div className="text-[11px] text-sky-300/90 font-medium mb-1 flex items-center gap-1">
                          <span>Sede:</span>
                          <strong className="text-white">{demo.academyName}</strong>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 leading-snug">
                        {demo.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Architecture Explanation Card */}
            <div className="mt-6 p-3.5 rounded-xl bg-[#0D1117] border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>¿Cómo funciona el Modelo de Seguridad?</span>
              </div>
              <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
                <li>
                  <strong className="text-purple-300">Super Admin:</strong> Ve todas las academias, MRR, planes Free/Pro/Enterprise y puede cambiar de sede.
                </li>
                <li>
                  <strong className="text-sky-300">Admin de Academia:</strong> Su token JWT solo tiene acceso a los datos de su propia sede. Si intenta consultar otra sede, el servidor devuelve <code>403 Forbidden</code>.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        Plataforma Deportiva SaaS Perú • Arquitectura Multi-Tenant con Aislamiento RLS en PostgreSQL 16
      </footer>
    </div>
  );
};
