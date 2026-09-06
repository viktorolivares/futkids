import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademy } from '../context/AcademyContext';
import { WebDashboard } from '../components/WebDashboard';

export const DashboardPage: React.FC = () => {
  const {
    students,
    sessions,
    charges,
    payments,
    currentUser,
    activeAcademy,
    setSelectedSession,
    subscription,
    setIsSubscriptionModalOpen,
  } = useAcademy();

  const navigate = useNavigate();

  return (
    <WebDashboard
      students={students}
      sessions={sessions}
      charges={charges}
      payments={payments}
      currentUser={currentUser!}
      academyName={activeAcademy.name}
      onNavigate={(tab) => navigate(`/${tab}`)}
      onSelectSession={(session) => {
        setSelectedSession(session);
        navigate('/classes');
      }}
      subscription={subscription}
      onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
    />
  );
};
