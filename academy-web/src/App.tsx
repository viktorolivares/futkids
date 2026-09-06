import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AcademyProvider } from './context/AcademyContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { TopLoadingBar } from './components/TopLoadingBar';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { ClassesPage } from './pages/ClassesPage';
import { CashierPage } from './pages/CashierPage';
import { BillingPage } from './pages/BillingPage';
import { AdminPage } from './pages/AdminPage';
import { SuperAdminPage } from './pages/SuperAdminPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AcademyProvider>
        {/* Top Loading Progress Bar - activates on every route change and async fetch */}
        <TopLoadingBar />

        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* SuperAdmin Master Route (Protected, SuperAdmin only) */}
          <Route element={<ProtectedRoute requireSuperAdmin />}>
            <Route path="/superadmin" element={<SuperAdminPage />} />
          </Route>

          {/* Tenant Routes (Protected, wrapped in AppLayout) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/cashier" element={<CashierPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AcademyProvider>
    </BrowserRouter>
  );
};

export default App;
