import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Crown, ArrowLeft } from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';
import { WebSidebar } from '../components/WebSidebar';
import { SaaSTrialBanner } from '../components/SaaSTrialBanner';
import { WebSubscriptionModal } from '../components/WebSubscriptionModal';
import { triggerTopLoading } from '../components/TopLoadingBar';

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
    triggerTopLoading(380);
    setSuperAdminMode('master');
    navigate('/superadmin');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row font-sans">
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
          <div className="bg-purple-50 border-b border-purple-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-purple-900">
              <Crown className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Modo Auditoría Super Admin:</strong> Inspeccionando la sede{' '}
                <strong className="text-purple-950 font-bold">{activeAcademy.name}</strong> (RUC: {activeAcademy.ruc})
              </span>
            </div>
            <button
              onClick={handleReturnToSuperAdmin}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Panel Maestro de Clientes</span>
            </button>
          </div>
        )}

        {/* SaaS Trial / Quota Banner */}
        <div className="px-4 sm:px-6 pt-5 shrink-0 max-w-7xl w-full mx-auto">
          <SaaSTrialBanner
            subscription={subscription}
            onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
          />
        </div>

        {/* 3. Main Outlet Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
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
