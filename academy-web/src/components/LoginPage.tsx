import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { DemoUser } from '../types';

interface LoginPageProps {
  onLogin: (user: DemoUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const performLogin = async (userEmail: string, userPass: string) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const authRes = await apiClient.login(userEmail.trim(), userPass);
      const backendUser = authRes.user;

      const userRole = backendUser.isSuperAdmin
        ? 'SUPER_ADMIN'
        : backendUser.memberships?.[0]?.role || 'ADMIN';

      const mappedUser: DemoUser = {
        id: backendUser.id,
        name: `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim() || backendUser.email,
        email: backendUser.email,
        roleLabel: backendUser.isSuperAdmin ? 'SUPER ADMIN MAESTRO' : `ROL: ${userRole}`,
        isSuperAdmin: Boolean(backendUser.isSuperAdmin),
        role: userRole as any,
        memberships: backendUser.memberships || [],
      };

      localStorage.setItem('academy_auth_user', JSON.stringify(mappedUser));

      if (backendUser.memberships?.[0]?.academyId) {
        apiClient.setAcademyId(backendUser.memberships[0].academyId);
      }

      onLogin(mappedUser);
    } catch (err: any) {
      console.error('[LoginPage] Error durante login:', err);
      setErrorMessage(
        err.message?.includes('Failed to fetch')
          ? 'No se pudo conectar con el servidor central. Verifica tu conexión de red o contacta a soporte.'
          : err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Por favor completa todos los campos.');
      return;
    }
    await performLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Corporate Brand Bar */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900">GESTICLUB</span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Plataforma SaaS Deportiva
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sistema Integral para Academias Deportivas • Facturación Electrónica SUNAT
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Aislamiento RLS Seguro</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Cifrado SSL/TLS 256 bits</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Container - Centered Production Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-sm">
            {/* Form Header */}
            <div className="mb-7 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 mb-4 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Iniciar Sesión
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Ingresa con tu correo registrado para acceder al portal operativo de tu academia o panel administrativo.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej. director@miacademia.pe"
                    autoComplete="email"
                    className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Para restablecer tu contraseña, contacta al administrador de tu academia o al soporte técnico central.')}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full bg-slate-50/70 border border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Recordar sesión en este dispositivo</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 mt-3 cursor-pointer"
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

            {/* Security Guarantee Box */}
            <div className="mt-7 pt-5 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Conexión segura con cifrado de punto a punto y autenticación por tokens JWT.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        GESTICLUB SaaS Perú • Todos los derechos reservados • Plataforma Deportiva Multi-Sede
      </footer>
    </div>
  );
};

export default LoginPage;
