import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAcademy } from '../context/AcademyContext';

interface ProtectedRouteProps {
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireSuperAdmin = false }) => {
  const { currentUser } = useAcademy();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireSuperAdmin && !currentUser.isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
