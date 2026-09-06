import React from 'react';
import { useAcademy } from '../context/AcademyContext';
import { WebAdminPanel } from '../components/WebAdminPanel';

export const AdminPage: React.FC = () => {
  const {
    activeAcademy,
    handleUpdateProfile,
    sports,
    staff,
    tariffs,
    handleAddSport,
    handleToggleSportStatus,
    handleAddStaffMember,
    handleRemoveStaffMember,
    handleAddTariff,
    subscription,
    setIsSubscriptionModalOpen,
  } = useAcademy();

  return (
    <WebAdminPanel
      academyProfile={activeAcademy}
      onUpdateProfile={handleUpdateProfile}
      sports={sports}
      staff={staff}
      tariffs={tariffs}
      onAddSport={handleAddSport}
      onToggleSportStatus={handleToggleSportStatus}
      onAddStaff={handleAddStaffMember}
      onRemoveStaff={handleRemoveStaffMember}
      onAddTariff={handleAddTariff}
      subscription={subscription}
      onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
    />
  );
};
