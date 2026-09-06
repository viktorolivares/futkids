import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Shield, LogOut } from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';
import { SaaSClientAdmin } from '../components/SaaSClientAdmin';

export const SuperAdminPage: React.FC = () => {
  const {
    currentUser,
    handleLogout,
    clients,
    handleUpdateClient,
    handleAddClient,
    handleEnterAcademyPortal,
  } = useAcademy();

  const navigate = useNavigate();

  const handleEnterPortal = (academyId: string) => {
    handleEnterAcademyPortal(academyId);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 flex flex-col font-sans">
      {/* Super Admin Top Header */}
      <header className="bg-[#0D1117] border-b border-purple-500/30 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white tracking-tight text-lg">GESTICLUB SAAS</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Panel Maestro Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Control Global de Clientes • Gestión de Suscripciones & MRR • Despliegue Multi-Tenant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>{currentUser?.name || 'Super Admin'}</span>
              </div>
              <div className="text-[10px] text-purple-300 font-mono">PLATFORM OWNER (MASTER)</div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/40 text-xs font-semibold text-rose-300 transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Master SaaS Client Administration */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <SaaSClientAdmin
          clients={clients}
          onUpdateClient={handleUpdateClient}
          onAddClient={handleAddClient}
          onEnterAcademyPortal={handleEnterPortal}
        />
      </main>
    </div>
  );
};
