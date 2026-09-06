import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Crown, ArrowLeft } from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';
import { WebSidebar } from '../components/WebSidebar';
import { SaaSTrialBanner } from '../components/SaaSTrialBanner';
import { WebSubscriptionModal } from '../components/WebSubscriptionModal';

export const AppLayout: React.FC = () => {
  const {
    currentUser,
    activeAcademy,
    authorizedAcademiesList,
    switchAcademy,
    subscription,
    isSubscriptionModalOpen,
    setIsSubscriptionModalOpen,
    handleUpgradeToPro,
    handleDowngradeToFree,
    handleSimulateExpireTrial,
    handleLogout,
    setSuperAdminMode,
  } = useAcademy();

  const navigate = useNavigate();

  if (!currentUser) {
    return null;
  }

  const handleReturnToSuperAdmin = () => {
    setSuperAdminMode('master');
    navigate('/superadmin');
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 flex flex-col lg:flex-row font-sans">
      {/* 1. Vertical Sidebar Navigation */}
      <WebSidebar
        activeAcademy={activeAcademy}
        academiesList={authorizedAcademiesList}
        onSelectAcademy={switchAcademy}
        subscription={subscription}
        onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
        userRole={currentUser.roleLabel || 'Usuario'}
        userName={currentUser.name}
        onLogout={handleLogout}
        isSuperAdmin={currentUser.isSuperAdmin}
        onReturnToSuperAdmin={handleReturnToSuperAdmin}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-y-auto">
        {/* Super Admin Impersonation Notice Bar */}
        {currentUser.isSuperAdmin && (
          <div className="bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-purple-950/90 border-b border-purple-500/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 text-purple-200">
              <Crown className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                <strong>Modo Auditoría Super Admin:</strong> Inspeccionando la sede{' '}
                <strong className="text-white">{activeAcademy.name}</strong> (RUC: {activeAcademy.ruc})
              </span>
            </div>
            <button
              onClick={handleReturnToSuperAdmin}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-600/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Panel Maestro de Clientes</span>
            </button>
          </div>
        )}

        {/* SaaS Trial / Quota Banner */}
        <div className="px-4 sm:px-6 pt-4 shrink-0 max-w-7xl w-full mx-auto">
          <SaaSTrialBanner
            subscription={subscription}
            onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
          />
        </div>

        {/* 3. Main Outlet Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* 4. Plan Upgrade Modal */}
      <WebSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        subscription={subscription}
        onUpgradeToPro={handleUpgradeToPro}
        onDowngradeToFree={handleDowngradeToFree}
        onSimulateExpireTrial={handleSimulateExpireTrial}
      />
    </div>
  );
};
