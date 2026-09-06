import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Shield, LogOut } from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';
import { SaaSClientAdmin } from '../components/SaaSClientAdmin';
import { triggerTopLoading } from '../components/TopLoadingBar';

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
    triggerTopLoading(400);
    handleEnterAcademyPortal(academyId);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Super Admin Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 tracking-tight text-lg">GESTICLUB SAAS</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Panel Maestro Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Control Global de Clientes • Gestión de Suscripciones & MRR • Despliegue Multi-Tenant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>{currentUser?.name || 'Super Admin'}</span>
              </div>
              <div className="text-[10px] text-purple-700 font-medium tracking-wide">PLATFORM OWNER (MASTER)</div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
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

export default SuperAdminPage;
