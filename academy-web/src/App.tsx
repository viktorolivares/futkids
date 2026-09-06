import React, { useState, useEffect } from 'react';
import {
  Crown,
  Shield,
  LogOut,
  ArrowLeft,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { WebNavbar } from './components/WebNavbar';
import { SaaSTrialBanner } from './components/SaaSTrialBanner';
import { WebDashboard } from './components/WebDashboard';
import { WebStudents } from './components/WebStudents';
import { WebClasses } from './components/WebClasses';
import { WebCashier } from './components/WebCashier';
import { WebBilling } from './components/WebBilling';
import { WebAdminPanel } from './components/WebAdminPanel';
import { WebSubscriptionModal } from './components/WebSubscriptionModal';
import { LoginPage } from './components/LoginPage';
import { SaaSClientAdmin } from './components/SaaSClientAdmin';
import { apiClient } from './services/apiClient';

import {
  WebTabType,
  WebStudent,
  WebGroup,
  WebClassSession,
  WebCharge,
  WebPayment,
  WebBillingInvoice,
  DemoUser,
  SubscriptionStatusInfo,
  WebSportItem,
  WebStaffMember,
  WebFeeTariff,
  WebAcademyProfile,
  SaaSClientAcademy,
  WebCustomerCredit,
  WebRefund,
  WebPackage,
  WebPackageCredit,
  WebTrial,
  WebPromotion,
  WebAcademyPolicy,
  WebFamily,
} from './types';

import {
  INITIAL_STUDENTS,
  INITIAL_FAMILIES,
  INITIAL_GROUPS,
  INITIAL_SESSIONS,
  INITIAL_CHARGES,
  INITIAL_PAYMENTS,
  INITIAL_INVOICES,
  INITIAL_CUSTOMER_CREDITS,
  INITIAL_REFUNDS,
  INITIAL_PACKAGES,
  INITIAL_PACKAGE_CREDITS,
  INITIAL_TRIALS,
  INITIAL_PROMOTIONS,
  INITIAL_ACADEMY_POLICIES,
} from './data/academyData';

import {
  INITIAL_ACADEMY_PROFILES,
  INITIAL_SPORTS,
  INITIAL_STAFF,
  INITIAL_TARIFFS,
} from './data/mockAdminData';

import { INITIAL_SAAS_CLIENTS } from './data/mockClientsData';

export const App: React.FC = () => {
  // Authentication state (supports session persistence and clean logout)
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(() => {
    try {
      const saved = localStorage.getItem('academy_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Super Admin view mode: 'master' = SaaS Client directory / MRR, 'tenant-impersonation' = inspecting a specific academy
  const [superAdminMode, setSuperAdminMode] = useState<'master' | 'tenant-impersonation'>('master');

  // Multi-Tenancy & Navigation State
  const [currentTab, setCurrentTab] = useState<WebTabType>('dashboard');
  const [activeAcademyId, setActiveAcademyId] = useState<string>('acad-alianza-01');

  // SaaS SuperAdmin Clients Directory
  const [clients, setClients] = useState<SaaSClientAcademy[]>(INITIAL_SAAS_CLIENTS);

  // Multi-Tenant Profiles
  const [academyProfiles, setAcademyProfiles] = useState<Record<string, WebAcademyProfile>>(
    INITIAL_ACADEMY_PROFILES
  );

  const activeAcademy = academyProfiles[activeAcademyId] || INITIAL_ACADEMY_PROFILES['acad-alianza-01'];

  // Calculate authorized academies list:
  // - Super Admin can access and switch between all registered academies
  // - Tenant staff can ONLY see and switch between their authorized memberships
  const authorizedAcademiesList = currentUser?.isSuperAdmin
    ? Object.values(academyProfiles).map((a) => ({ id: a.id, name: a.name }))
    : currentUser?.memberships?.map((m) => ({ id: m.academyId, name: m.academyName })) || [
        { id: activeAcademy.id, name: activeAcademy.name },
      ];

  // Domain state
  const [students, setStudents] = useState<WebStudent[]>(INITIAL_STUDENTS);
  const [families, setFamilies] = useState<WebFamily[]>(INITIAL_FAMILIES);
  const [groups] = useState<WebGroup[]>(INITIAL_GROUPS);
  const [sessions, setSessions] = useState<WebClassSession[]>(INITIAL_SESSIONS);
  const [charges, setCharges] = useState<WebCharge[]>(INITIAL_CHARGES);
  const [payments, setPayments] = useState<WebPayment[]>(INITIAL_PAYMENTS);
  const [invoices, setInvoices] = useState<WebBillingInvoice[]>(INITIAL_INVOICES);
  const [sports, setSports] = useState<WebSportItem[]>(INITIAL_SPORTS);
  const [staff, setStaff] = useState<WebStaffMember[]>(INITIAL_STAFF);
  const [tariffs, setTariffs] = useState<WebFeeTariff[]>(INITIAL_TARIFFS);

  // New modules: Customer Credits, Refunds, Packages, Package Credits, Trials, Promotions, Academy Policies
  const [customerCredits, setCustomerCredits] = useState<WebCustomerCredit[]>(INITIAL_CUSTOMER_CREDITS);
  const [refunds, setRefunds] = useState<WebRefund[]>(INITIAL_REFUNDS);
  const [packages, setPackages] = useState<WebPackage[]>(INITIAL_PACKAGES);
  const [packageCredits, setPackageCredits] = useState<WebPackageCredit[]>(INITIAL_PACKAGE_CREDITS);
  const [trials, setTrials] = useState<WebTrial[]>(INITIAL_TRIALS);
  const [promotions, setPromotions] = useState<WebPromotion[]>(INITIAL_PROMOTIONS);
  const [academyPolicy, setAcademyPolicy] = useState<WebAcademyPolicy>(INITIAL_ACADEMY_POLICIES[0]);

  // Selected student or family for quick checkout
  const [preselectedStudent, setPreselectedStudent] = useState<WebStudent | null>(null);
  const [preselectedFamily, setPreselectedFamily] = useState<WebFamily | null>(null);

  // SaaS Subscription State for current active academy
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatusInfo>({
    plan: {
      code: 'PRO',
      name: 'Plan PRO',
      priceMonthly: 99.0,
      currency: 'PEN',
    },
    status: 'TRIALING',
    trial: {
      active: true,
      startsAt: '2026-03-01T00:00:00Z',
      endsAt: '2026-03-15T23:59:59Z',
      remainingDays: 10,
    },
    limits: {
      students: null,
      groups: null,
      sports: null,
      users: null,
    },
    usage: {
      students: INITIAL_STUDENTS.length,
      groups: INITIAL_GROUPS.length,
      sports: INITIAL_SPORTS.length,
      users: INITIAL_STAFF.length,
    },
    overLimit: false,
    features: {
      sunatBilling: true,
      whatsappAutomation: true,
      unlimitedStudents: true,
    },
  });

  const [selectedSession, setSelectedSession] = useState<WebClassSession | null>(
    INITIAL_SESSIONS[0] || null
  );

  // Sync client headers with API client whenever active academy changes
  useEffect(() => {
    apiClient.setAcademyId(activeAcademyId);
  }, [activeAcademyId]);

  // Handle Login & Session setup
  const handleLogin = (user: DemoUser) => {
    setCurrentUser(user);
    if (user.isSuperAdmin) {
      setSuperAdminMode('master');
    } else if (user.memberships && user.memberships.length > 0) {
      setActiveAcademyId(user.memberships[0].academyId);
      setSuperAdminMode('tenant-impersonation');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('academy_auth_user');
    setCurrentUser(null);
    setSuperAdminMode('master');
    setCurrentTab('dashboard');
  };

  // SuperAdmin handlers
  const handleUpdateClient = (updated: SaaSClientAcademy) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddClient = (newClient: SaaSClientAcademy) => {
    setClients((prev) => [newClient, ...prev]);
    setAcademyProfiles((prev) => ({
      ...prev,
      [newClient.id]: {
        id: newClient.id,
        name: newClient.name,
        legalName: newClient.legalName,
        ruc: newClient.ruc,
        address: newClient.address,
        district: 'Central',
        city: newClient.city,
        department: newClient.department,
        phone: newClient.phone,
        whatsapp: newClient.phone,
        email: newClient.email,
        openingHours: 'Lunes a Sábado: 08:00 - 20:00',
        sunatConfig: {
          solUser: 'MODDATOS',
          solPassConfigured: true,
          environment: 'BETA',
          certificateStatus: 'VALID',
          certificateExpiresAt: '2027-12-31',
          defaultSeriesBoleta: 'B001',
          defaultSeriesFactura: 'F001',
        },
      },
    }));
  };

  const handleEnterAcademyPortal = (academyId: string) => {
    setActiveAcademyId(academyId);
    setSuperAdminMode('tenant-impersonation');
    setCurrentTab('dashboard');
  };

  // Operations handlers
  const handleAddStudent = (newStudent: WebStudent) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleAddFamily = (newFamily: WebFamily) => {
    setFamilies((prev) => [newFamily, ...prev]);
  };

  const handleUpdateFamily = (updatedFamily: WebFamily) => {
    setFamilies((prev) => prev.map((f) => (f.id === updatedFamily.id ? updatedFamily : f)));
  };

  const handleQuickPay = (student: WebStudent) => {
    setPreselectedStudent(student);
    setPreselectedFamily(null);
    setCurrentTab('cashier');
  };

  const handleQuickPayFamily = (family: WebFamily) => {
    setPreselectedFamily(family);
    setPreselectedStudent(null);
    setCurrentTab('cashier');
  };

  const handleUpdateSession = (updatedSession: WebClassSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
    setSelectedSession(updatedSession);
  };

  const handleRegisterPayment = (newPayment: WebPayment, newInvoice?: WebBillingInvoice) => {
    setPayments((prev) => [newPayment, ...prev]);
    if (newInvoice) {
      setInvoices((prev) => [newInvoice, ...prev]);
    }

    if (newPayment.allocations && newPayment.allocations.length > 0) {
      // 1. Multi-allocation payment (Cobranza Familiar Consolidada)
      setCharges((prev) =>
        prev.map((c) => {
          const alloc = newPayment.allocations?.find((a) => a.chargeId === c.id);
          if (alloc) {
            const newPaid = c.paidAmount + alloc.amount;
            const newBal = Math.max(0, c.amount - newPaid);
            return {
              ...c,
              paidAmount: newPaid,
              balance: newBal,
              status: newBal <= 0 ? 'PAID' : 'PARTIALLY_PAID',
            };
          }
          return c;
        })
      );

      // Reduce each affected student's balance
      const studentPaidMap: Record<string, number> = {};
      newPayment.allocations.forEach((a) => {
        studentPaidMap[a.studentName] = (studentPaidMap[a.studentName] || 0) + a.amount;
      });

      setStudents((prev) =>
        prev.map((s) => {
          if (studentPaidMap[s.name]) {
            return {
              ...s,
              balance: Math.max(0, s.balance - studentPaidMap[s.name]),
            };
          }
          return s;
        })
      );
    } else {
      // 2. Single-student payment
      setCharges((prev) =>
        prev.map((c) => {
          if (c.studentName === newPayment.studentName && c.status !== 'PAID') {
            const newPaid = c.paidAmount + newPayment.amount;
            const newBal = Math.max(0, c.amount - newPaid);
            return {
              ...c,
              paidAmount: newPaid,
              balance: newBal,
              status: newBal === 0 ? 'PAID' : 'PARTIALLY_PAID',
            };
          }
          return c;
        })
      );

      setStudents((prev) =>
        prev.map((s) => {
          if (s.name === newPayment.studentName) {
            return {
              ...s,
              balance: Math.max(0, s.balance - newPayment.amount),
            };
          }
          return s;
        })
      );
    }
  };

  const handleEmitInvoiceForPayment = (
    payment: WebPayment,
    invoiceType: 'RECIBO' | 'BOLETA' | 'FACTURA' = 'RECIBO'
  ) => {
    const isRecibo = invoiceType === 'RECIBO';
    const series = isRecibo ? 'R001' : invoiceType === 'FACTURA' ? 'F001' : 'B001';
    const sameSeries = invoices.filter((i) => i.series === series);
    const nextCorrelative =
      sameSeries.length > 0 ? Math.max(...sameSeries.map((s) => s.correlative)) + 1 : 101;
    const invNum = `${series}-${nextCorrelative.toString().padStart(8, '0')}`;

    let subtotal = payment.amount;
    let igv = 0;
    if (!isRecibo) {
      subtotal = Number((payment.amount / 1.18).toFixed(2));
      igv = Number((payment.amount - subtotal).toFixed(2));
    }

    const newInvoice: WebBillingInvoice = {
      id: `inv-${Date.now()}`,
      type: invoiceType,
      series,
      correlative: nextCorrelative,
      clientName: payment.studentName.toUpperCase(),
      clientDoc: '74829103',
      clientPhone: payment.studentPhone || '+51 987 654 321',
      subtotal,
      igv,
      total: payment.amount,
      status: isRecibo ? 'ISSUED' : 'ACCEPTED',
      sunatCode: isRecibo ? undefined : '0',
      sunatMessage: isRecibo
        ? 'Recibo de caja generado correctamente.'
        : `Comprobante ${invNum} aceptado por SUNAT.`,
      issuedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      digestValue: isRecibo ? undefined : 'm44X84LmQ0w1Zp88aK==',
      concept: payment.description,
      paymentMethod: payment.paymentMethod,
      receivedBy: payment.receivedBy,
      isInternalReceipt: isRecibo,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    const updatedPayment: WebPayment = {
      ...payment,
      invoiceType,
      invoiceNumber: invNum,
      invoiceStatus: isRecibo ? 'ISSUED' : 'ACCEPTED',
    };
    setPayments((prev) => prev.map((p) => (p.id === payment.id ? updatedPayment : p)));
  };

  // Handlers for Credits, Refunds, Packages, and Trials
  const handleConsumePackageCredit = (studentId: string) => {
    setPackageCredits((prev) =>
      prev.map((pc) => {
        if (pc.studentId === studentId && pc.status === 'ACTIVE' && pc.usedClasses < pc.totalClasses) {
          const nextUsed = pc.usedClasses + 1;
          return {
            ...pc,
            usedClasses: nextUsed,
            status: nextUsed >= pc.totalClasses ? 'EXHAUSTED' : 'ACTIVE',
          };
        }
        return pc;
      })
    );
  };

  const handleApplyCustomerCredit = (creditId: string, usedAmount: number) => {
    setCustomerCredits((prev) =>
      prev.map((c) => {
        if (c.id === creditId) {
          const newRemaining = Math.max(0, c.remaining - usedAmount);
          return {
            ...c,
            remaining: newRemaining,
            status: (newRemaining <= 0 ? 'EXHAUSTED' : 'AVAILABLE') as 'AVAILABLE' | 'EXHAUSTED' | 'EXPIRED',
          };
        }
        return c;
      })
    );
  };

  const handleAddCustomerCredit = (newCredit: WebCustomerCredit) => {
    setCustomerCredits((prev) => [newCredit, ...prev]);
  };

  const handleAddRefund = (newRefund: WebRefund, paymentId: string) => {
    setRefunds((prev) => [newRefund, ...prev]);
  };

  const handleAddPackageCredit = (newPkgCredit: WebPackageCredit) => {
    setPackageCredits((prev) => [newPkgCredit, ...prev]);
  };

  const handleConvertTrial = (trialId: string) => {
    setTrials((prev) =>
      prev.map((t) =>
        t.id === trialId
          ? {
              ...t,
              converted: true,
              convertedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : t
      )
    );
  };

  const handleAddPackage = (newPkg: WebPackage) => {
    setPackages((prev) => [newPkg, ...prev]);
  };

  const handleAddPromotion = (newPromo: WebPromotion) => {
    setPromotions((prev) => [newPromo, ...prev]);
  };

  const handleUpdateProfile = (updatedProfile: WebAcademyProfile) => {
    setAcademyProfiles((prev) => ({
      ...prev,
      [updatedProfile.id]: updatedProfile,
    }));
  };

  const handleToggleSportStatus = (id: string) => {
    setSports((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)));
  };

  const handleUpgradeToPro = () => {
    setSubscription((prev) => ({
      ...prev,
      plan: { code: 'PRO', name: 'Plan PRO', priceMonthly: 99.0, currency: 'PEN' },
      status: 'ACTIVE',
      trial: { ...prev.trial, active: false },
      limits: { students: null, groups: null, sports: null, users: null },
      overLimit: false,
      features: { sunatBilling: true, whatsappAutomation: true, unlimitedStudents: true },
    }));
    setIsSubscriptionModalOpen(false);
  };

  const handleDowngradeToFree = () => {
    setSubscription((prev) => ({
      ...prev,
      plan: { code: 'FREE', name: 'Plan Free', priceMonthly: 0.0, currency: 'PEN' },
      status: 'ACTIVE',
      trial: { ...prev.trial, active: false, remainingDays: 0 },
      limits: { students: 30, groups: 2, sports: 1, users: 2 },
      overLimit: students.length > 30,
      features: { sunatBilling: false, whatsappAutomation: false, unlimitedStudents: false },
    }));
    setIsSubscriptionModalOpen(false);
  };

  const handleSimulateExpireTrial = () => {
    setSubscription({
      plan: { code: 'FREE', name: 'Plan Free (Expirado)', priceMonthly: 0.0, currency: 'PEN' },
      status: 'EXPIRED',
      trial: { active: false, startsAt: null, endsAt: null, remainingDays: 0 },
      limits: { students: 30, groups: 2, sports: 1, users: 2 },
      usage: {
        students: students.length,
        groups: groups.length,
        sports: sports.length,
        users: staff.length,
      },
      overLimit: students.length > 30,
      features: { sunatBilling: false, whatsappAutomation: false, unlimitedStudents: false },
    });
  };

  // 1. IF NOT LOGGED IN -> RENDER LOGIN PAGE
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // 2. IF SUPER ADMIN IN 'MASTER' VIEW -> RENDER SUPER ADMIN MASTER PORTAL
  if (currentUser.isSuperAdmin && superAdminMode === 'master') {
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
                  <span className="font-black text-white tracking-tight text-lg">SPORTACADEMY SAAS</span>
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
                  <span>{currentUser.name}</span>
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
            onEnterAcademyPortal={handleEnterAcademyPortal}
          />
        </main>
      </div>
    );
  }

  // 3. IF TENANT VIEW (Either regular tenant user OR SuperAdmin inspecting a specific academy)
  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 flex flex-col font-sans">
      {/* Super Admin Impersonation Notice Bar */}
      {currentUser.isSuperAdmin && (
        <div className="bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-purple-950/90 border-b border-purple-500/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-purple-200">
            <Crown className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>Modo Auditoría Super Admin:</strong> Inspeccionando la sede{' '}
              <strong className="text-white">{activeAcademy.name}</strong> (RUC: {activeAcademy.ruc})
            </span>
          </div>
          <button
            onClick={() => setSuperAdminMode('master')}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-600/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Panel Maestro de Clientes</span>
          </button>
        </div>
      )}

      {/* 1. Header & Navigation (Exclusively for academy management) */}
      <WebNavbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeAcademy={activeAcademy}
        academiesList={authorizedAcademiesList}
        onSelectAcademy={setActiveAcademyId}
        subscription={subscription}
        onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
        userRole={currentUser.roleLabel}
        onLogout={handleLogout}
        isSuperAdmin={currentUser.isSuperAdmin}
        onReturnToSuperAdmin={() => setSuperAdminMode('master')}
      />

      {/* 2. SaaS Trial / Quota Banner */}
      <SaaSTrialBanner
        subscription={subscription}
        onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
      />

      {/* 3. Main Operational Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'dashboard' && (
          <WebDashboard
            students={students}
            sessions={sessions}
            charges={charges}
            payments={payments}
            currentUser={currentUser}
            academyName={activeAcademy.name}
            onNavigate={setCurrentTab}
            onSelectSession={(session) => {
              setSelectedSession(session);
              setCurrentTab('classes');
            }}
            subscription={subscription}
            onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
          />
        )}

        {currentTab === 'students' && (
          <WebStudents
            students={students}
            groups={groups}
            families={families}
            charges={charges}
            payments={payments}
            customerCredits={customerCredits}
            invoices={invoices}
            onAddFamily={handleAddFamily}
            onUpdateFamily={handleUpdateFamily}
            onAddStudent={handleAddStudent}
            onQuickPay={handleQuickPay}
            onQuickPayFamily={handleQuickPayFamily}
            subscription={subscription}
            onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
          />
        )}

        {currentTab === 'classes' && (
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
        )}

        {currentTab === 'cashier' && (
          <WebCashier
            charges={charges}
            payments={payments}
            students={students}
            families={families}
            preselectedStudent={preselectedStudent}
            preselectedFamily={preselectedFamily}
            onClearPreselectedStudent={() => setPreselectedStudent(null)}
            onClearPreselectedFamily={() => setPreselectedFamily(null)}
            invoices={invoices}
            academyProfile={activeAcademy}
            customerCredits={customerCredits}
            refunds={refunds}
            packages={packages}
            packageCredits={packageCredits}
            trials={trials}
            promotions={promotions}
            onAddPayment={handleRegisterPayment}
            onEmitInvoiceForPayment={handleEmitInvoiceForPayment}
            onAddCustomerCredit={handleAddCustomerCredit}
            onApplyCustomerCredit={handleApplyCustomerCredit}
            onAddRefund={handleAddRefund}
            onAddPackageCredit={handleAddPackageCredit}
            onConsumePackageCredit={handleConsumePackageCredit}
            onAddPackage={handleAddPackage}
            onAddPromotion={handleAddPromotion}
            onConvertTrial={handleConvertTrial}
          />
        )}

        {currentTab === 'billing' && (
          <WebBilling
            invoices={invoices}
            onAddInvoice={(newInv) => setInvoices((prev) => [newInv, ...prev])}
            students={students}
            academyProfile={activeAcademy}
            subscription={subscription}
            onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
          />
        )}

        {currentTab === 'admin' && (
          <WebAdminPanel
            academyProfile={activeAcademy}
            onUpdateProfile={handleUpdateProfile}
            sports={sports}
            staff={staff}
            tariffs={tariffs}
            onAddSport={(sport) => setSports((prev) => [...prev, sport])}
            onToggleSportStatus={handleToggleSportStatus}
            onAddStaff={(member) => setStaff((prev) => [...prev, member])}
            onAddTariff={(tariff) => setTariffs((prev) => [...prev, tariff])}
            subscription={subscription}
            onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
          />
        )}
      </main>

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

export default App;
