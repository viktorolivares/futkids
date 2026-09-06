import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademy } from '../context/AcademyContext';
import { LoginPage as LoginFormComponent } from '../components/LoginPage';
import { DemoUser } from '../types';

export const LoginPage: React.FC = () => {
  const { currentUser, handleLogin } = useAcademy();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.isSuperAdmin) {
        navigate('/superadmin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const onLoginSuccess = (user: DemoUser) => {
    handleLogin(user);
    if (user.isSuperAdmin) {
      navigate('/superadmin', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return <LoginFormComponent onLogin={onLoginSuccess} />;
};
