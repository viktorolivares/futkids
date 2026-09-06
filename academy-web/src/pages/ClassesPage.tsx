import React from 'react';
import { useAcademy } from '../context/AcademyContext';
import { WebClasses } from '../components/WebClasses';

export const ClassesPage: React.FC = () => {
  const {
    sessions,
    groups,
    selectedSession,
    students,
    families,
    academyPolicy,
    packageCredits,
    handleUpdateSession,
    handleAddCustomerCredit,
    handleConsumePackageCredit,
    handleConvertTrial,
    activeAcademy,
  } = useAcademy();

  return (
    <WebClasses
      sessions={sessions}
      groups={groups}
      selectedSession={selectedSession}
      students={students}
      families={families}
      policy={academyPolicy}
      packageCredits={packageCredits}
      onUpdateSession={handleUpdateSession}
      onGenerateCustomerCredit={handleAddCustomerCredit}
      onConsumePackageCredit={handleConsumePackageCredit}
      onConvertTrial={handleConvertTrial}
      academyName={activeAcademy?.name}
    />
  );
};
