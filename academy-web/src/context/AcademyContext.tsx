import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import {
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
} from '../types';

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
} from '../data/academyData';

import {
  INITIAL_ACADEMY_PROFILES,
  INITIAL_SPORTS,
  INITIAL_STAFF,
  INITIAL_TARIFFS,
} from '../data/mockAdminData';

import { INITIAL_SAAS_CLIENTS } from '../data/mockClientsData';

interface AcademyContextType {
  // Auth
  currentUser: DemoUser | null;
  handleLogin: (user: DemoUser) => void;
  handleLogout: () => void;

  // Multi-Tenancy
  activeAcademyId: string;
  activeAcademy: WebAcademyProfile;
  authorizedAcademiesList: { id: string; name: string }[];
  switchAcademy: (academyId: string) => void;
  academyProfiles: Record<string, WebAcademyProfile>;
  setAcademyProfiles: React.Dispatch<React.SetStateAction<Record<string, WebAcademyProfile>>>;

  // SuperAdmin
  superAdminMode: 'master' | 'tenant-impersonation';
  setSuperAdminMode: (mode: 'master' | 'tenant-impersonation') => void;
  clients: SaaSClientAcademy[];
  handleAddClient: (newClient: SaaSClientAcademy) => Promise<void>;
  handleUpdateClient: (updated: SaaSClientAcademy) => void;
  handleEnterAcademyPortal: (academyId: string) => void;

  // Subscription / SaaS
  subscription: SubscriptionStatusInfo;
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
  handleUpgradeToPro: () => Promise<void>;
  handleDowngradeToFree: () => Promise<void>;
  handleSimulateExpireTrial: () => void;

  // Domain Entities
  students: WebStudent[];
  handleAddStudent: (student: WebStudent) => Promise<void>;
  families: WebFamily[];
  handleAddFamily: (family: WebFamily) => Promise<void>;
  handleUpdateFamily: (family: WebFamily) => Promise<void>;
  groups: WebGroup[];
  sessions: WebClassSession[];
  selectedSession: WebClassSession | null;
  setSelectedSession: (session: WebClassSession | null) => void;
  handleUpdateSession: (session: WebClassSession) => Promise<void>;
  charges: WebCharge[];
  payments: WebPayment[];
  handleRegisterPayment: (payment: WebPayment, invoice?: WebBillingInvoice) => Promise<void>;
  invoices: WebBillingInvoice[];
  setInvoices: React.Dispatch<React.SetStateAction<WebBillingInvoice[]>>;
  handleEmitInvoiceForPayment: (payment: WebPayment, type?: 'RECIBO' | 'BOLETA' | 'FACTURA') => Promise<void>;
  customerCredits: WebCustomerCredit[];
  handleAddCustomerCredit: (credit: WebCustomerCredit) => void;
  handleApplyCustomerCredit: (creditId: string, usedAmount: number) => void;
  refunds: WebRefund[];
  handleAddRefund: (refund: WebRefund, paymentId: string) => Promise<void>;
  packages: WebPackage[];
  handleAddPackage: (pkg: WebPackage) => Promise<void>;
  packageCredits: WebPackageCredit[];
  handleAddPackageCredit: (credit: WebPackageCredit) => void;
  handleConsumePackageCredit: (studentId: string) => void;
  trials: WebTrial[];
  handleConvertTrial: (trialId: string) => Promise<void>;
  promotions: WebPromotion[];
  handleAddPromotion: (promo: WebPromotion) => Promise<void>;
  academyPolicy: WebAcademyPolicy;
  sports: WebSportItem[];
  setSports: React.Dispatch<React.SetStateAction<WebSportItem[]>>;
  handleToggleSportStatus: (id: string) => void;
  handleAddSport: (sport: WebSportItem) => Promise<void>;
  staff: WebStaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<WebStaffMember[]>>;
  handleAddStaffMember: (member: WebStaffMember) => Promise<void>;
  handleRemoveStaffMember: (membershipId: string) => Promise<void>;
  tariffs: WebFeeTariff[];
  setTariffs: React.Dispatch<React.SetStateAction<WebFeeTariff[]>>;
  handleAddTariff: (tariff: WebFeeTariff) => void;
  preselectedStudent: WebStudent | null;
  setPreselectedStudent: (student: WebStudent | null) => void;
  preselectedFamily: WebFamily | null;
  setPreselectedFamily: (family: WebFamily | null) => void;

  // Loader & Profile updates
  loadAcademyData: (academyId: string) => Promise<void>;
  handleUpdateProfile: (profile: WebAcademyProfile) => Promise<void>;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(() => {
    try {
      const saved = localStorage.getItem('academy_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Super Admin view mode
  const [superAdminMode, setSuperAdminMode] = useState<'master' | 'tenant-impersonation'>('master');

  // Multi-Tenancy
  const [activeAcademyId, setActiveAcademyId] = useState<string>(
    () => localStorage.getItem('academy_active_id') || 'acad-demo-01'
  );

  const [clients, setClients] = useState<SaaSClientAcademy[]>(INITIAL_SAAS_CLIENTS);
  const [academyProfiles, setAcademyProfiles] = useState<Record<string, WebAcademyProfile>>(INITIAL_ACADEMY_PROFILES);

  const activeAcademy =
    academyProfiles[activeAcademyId] ||
    INITIAL_ACADEMY_PROFILES['acad-demo-01'] ||
    INITIAL_ACADEMY_PROFILES[Object.keys(academyProfiles)[0]];

  // Deduplicated list of authorized academies
  const rawAuthorizedList = currentUser?.isSuperAdmin
    ? Object.values(academyProfiles).map((a) => ({ id: a.id, name: a.name }))
    : currentUser?.memberships?.map((m) => ({ id: m.academyId, name: m.academyName })) || [
        { id: activeAcademy.id, name: activeAcademy.name },
      ];

  const authorizedAcademiesList = Array.from(
    new Map(rawAuthorizedList.map((item) => [item.id, item])).values()
  );

  // Switch Academy handler
  const switchAcademy = useCallback((academyId: string) => {
    setActiveAcademyId(academyId);
    localStorage.setItem('academy_active_id', academyId);
    apiClient.setAcademyId(academyId);
  }, []);

  // Domain State
  const [students, setStudents] = useState<WebStudent[]>(INITIAL_STUDENTS);
  const [families, setFamilies] = useState<WebFamily[]>(INITIAL_FAMILIES);
  const [groups, setGroups] = useState<WebGroup[]>(INITIAL_GROUPS);
  const [sessions, setSessions] = useState<WebClassSession[]>(INITIAL_SESSIONS);
  const [charges, setCharges] = useState<WebCharge[]>(INITIAL_CHARGES);
  const [payments, setPayments] = useState<WebPayment[]>(INITIAL_PAYMENTS);
  const [invoices, setInvoices] = useState<WebBillingInvoice[]>(INITIAL_INVOICES);
  const [sports, setSports] = useState<WebSportItem[]>(INITIAL_SPORTS);
  const [staff, setStaff] = useState<WebStaffMember[]>(INITIAL_STAFF);
  const [tariffs, setTariffs] = useState<WebFeeTariff[]>(INITIAL_TARIFFS);

  const [customerCredits, setCustomerCredits] = useState<WebCustomerCredit[]>(INITIAL_CUSTOMER_CREDITS);
  const [refunds, setRefunds] = useState<WebRefund[]>(INITIAL_REFUNDS);
  const [packages, setPackages] = useState<WebPackage[]>(INITIAL_PACKAGES);
  const [packageCredits, setPackageCredits] = useState<WebPackageCredit[]>(INITIAL_PACKAGE_CREDITS);
  const [trials, setTrials] = useState<WebTrial[]>(INITIAL_TRIALS);
  const [promotions, setPromotions] = useState<WebPromotion[]>(INITIAL_PROMOTIONS);
  const [academyPolicy, setAcademyPolicy] = useState<WebAcademyPolicy>(INITIAL_ACADEMY_POLICIES[0]);

  const [preselectedStudent, setPreselectedStudent] = useState<WebStudent | null>(null);
  const [preselectedFamily, setPreselectedFamily] = useState<WebFamily | null>(null);
  const [selectedSession, setSelectedSession] = useState<WebClassSession | null>(INITIAL_SESSIONS[0] || null);

  // SaaS Subscription State
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatusInfo>({
    plan: {
      code: 'PRO',
      name: 'Plan PRO',
      priceMonthly: 99.0,
      currency: 'PEN',
    },
    status: 'ACTIVE',
    trial: {
      active: false,
      startsAt: null,
      endsAt: null,
      remainingDays: 0,
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

  // ==========================================
  // MASTER DATA LOADER (From PostgreSQL API)
  // ==========================================
  const loadAcademyData = useCallback(async (academyId: string) => {
    apiClient.setAcademyId(academyId);

    try {
      const results = await Promise.allSettled([
        apiClient.getStudents(),
        apiClient.getFamilies(),
        apiClient.getGroups(),
        apiClient.getSports(),
        apiClient.getSessions(),
        apiClient.getCharges(),
        apiClient.getPayments(),
        apiClient.getInvoices({ limit: 100 }),
        apiClient.getCustomerCredits(),
        apiClient.getPackages(),
        apiClient.getPromotions(),
        apiClient.getTrials(),
        apiClient.getPolicy(),
        apiClient.getSubscription(),
        apiClient.getAllAcademies().catch(() => apiClient.getMyAcademies()),
        apiClient.getStaff(academyId),
        apiClient.getBillingConfig(academyId),
      ]);

      const [
        studentsRes,
        familiesRes,
        groupsRes,
        sportsRes,
        sessionsRes,
        chargesRes,
        paymentsRes,
        invoicesRes,
        creditsRes,
        packagesRes,
        promotionsRes,
        trialsRes,
        policyRes,
        subRes,
        academiesRes,
        staffRes,
        billingRes,
      ] = results;

      // 1. Estudiantes
      if (studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value) && studentsRes.value.length > 0) {
        setStudents(studentsRes.value);
      }

      // 2. Familias
      if (familiesRes.status === 'fulfilled' && Array.isArray(familiesRes.value) && familiesRes.value.length > 0) {
        setFamilies(familiesRes.value);
      }

      // 3. Grupos
      if (groupsRes.status === 'fulfilled' && Array.isArray(groupsRes.value) && groupsRes.value.length > 0) {
        setGroups(groupsRes.value);
      }

      // 4. Deportes
      if (sportsRes.status === 'fulfilled' && Array.isArray(sportsRes.value) && sportsRes.value.length > 0) {
        setSports((prev) =>
          sportsRes.value.map((s: any, idx: number) => ({
            id: s.id,
            name: s.name,
            iconName: prev[idx]?.iconName || 'Activity',
            description: s.description || '',
            categories: prev[idx]?.categories || ['Sub-6', 'Sub-8', 'Sub-10', 'Sub-12'],
            assignedCourts: prev[idx]?.assignedCourts || ['Cancha Principal', 'Cancha Sintética 1'],
            monthlyFee: prev[idx]?.monthlyFee || 180,
            activeStudents: s.groupsCount * 12 || 15,
            isActive: s.isActive ?? true,
          }))
        );
      }

      // 5. Sesiones
      if (sessionsRes.status === 'fulfilled' && Array.isArray(sessionsRes.value) && sessionsRes.value.length > 0) {
        setSessions(sessionsRes.value);
        setSelectedSession(sessionsRes.value[0] || null);
      }

      // 6. Cargos
      if (chargesRes.status === 'fulfilled' && Array.isArray(chargesRes.value) && chargesRes.value.length > 0) {
        setCharges(chargesRes.value);
      }

      // 7. Pagos
      if (paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value) && paymentsRes.value.length > 0) {
        setPayments(paymentsRes.value);
      }

      // 8. Facturas SUNAT
      if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value) && invoicesRes.value.length > 0) {
        setInvoices(
          invoicesRes.value.map((inv: any) => ({
            id: inv.id,
            type: inv.invoiceType as any,
            series: inv.series,
            correlative: inv.correlative,
            clientName: inv.clientName,
            clientDoc: inv.clientDocNum,
            subtotal: Number(inv.subtotal),
            igv: Number(inv.igv),
            total: Number(inv.total),
            status: inv.status as any,
            issuedAt: inv.issuedAt || inv.createdAt,
            sunatMessage: inv.sunatMessage || 'Aceptado por SUNAT',
            items: Array.isArray(inv.items) ? inv.items : [],
          }))
        );
      }

      // 9. Créditos a favor
      if (creditsRes.status === 'fulfilled' && Array.isArray(creditsRes.value)) {
        setCustomerCredits(creditsRes.value);
      }

      // 10. Paquetes
      if (packagesRes.status === 'fulfilled' && Array.isArray(packagesRes.value) && packagesRes.value.length > 0) {
        setPackages(packagesRes.value);
      }

      // 11. Promociones
      if (promotionsRes.status === 'fulfilled' && Array.isArray(promotionsRes.value) && promotionsRes.value.length > 0) {
        setPromotions(promotionsRes.value);
      }

      // 12. Clases de Prueba
      if (trialsRes.status === 'fulfilled' && Array.isArray(trialsRes.value) && trialsRes.value.length > 0) {
        setTrials(trialsRes.value);
      }

      // 13. Políticas
      if (policyRes.status === 'fulfilled' && policyRes.value) {
        setAcademyPolicy(policyRes.value);
      }

      // 14. Suscripción SaaS
      if (subRes.status === 'fulfilled' && subRes.value && subRes.value.plan) {
        const res = subRes.value;
        setSubscription((prev) => ({
          ...prev,
          plan: {
            code: res.plan.code || 'PRO',
            name: res.plan.name || 'Plan PRO',
            priceMonthly: res.plan.priceMonthly || 99,
            currency: res.plan.currency || 'PEN',
          },
          status: res.status || 'ACTIVE',
          trial: res.trial || prev.trial,
          limits: res.limits || prev.limits,
          usage: res.usage || prev.usage,
          overLimit: Boolean(res.overLimit),
          features: {
            sunatBilling: Boolean(res.features?.SUNAT_BILLING ?? true),
            whatsappAutomation: Boolean(res.features?.WHATSAPP_AUTOMATION ?? true),
            unlimitedStudents: !res.limits?.students,
          },
        }));
      }

      // 15. Academias del sistema
      if (academiesRes.status === 'fulfilled' && Array.isArray(academiesRes.value) && academiesRes.value.length > 0) {
        const mappedClients: SaaSClientAcademy[] = academiesRes.value.map((raw: any) => {
          const a = raw.academy || raw;
          const sub = a.subscription;
          const planCode = typeof a.plan === 'string' ? a.plan : (sub?.plan?.code || sub?.planCode || 'PRO');
          const planStatus = typeof a.planStatus === 'string' ? a.planStatus : (sub?.status || 'ACTIVE');
          return {
            id: a.id,
            slug: a.slug || a.id,
            name: a.name || 'Academia Deportiva',
            legalName: a.legalName || a.name || 'Academia Deportiva SAC',
            ruc: a.ruc || '20123456789',
            address: a.address || 'Av. Principal 123',
            city: a.city || 'Lima',
            department: a.department || 'Lima',
            phone: a.phone || '+51 987 654 321',
            email: a.email || 'contacto@academia.pe',
            contactPerson: a.contactPerson || 'Director de Sede',
            plan: planCode as any,
            planStatus: planStatus as any,
            trialDaysLeft: a.trialDaysLeft ?? 14,
            trialEndsAt: a.trialEndsAt ?? (sub?.trialEndsAt || null),
            mrr: a.mrr ?? (planCode === 'PRO' ? 99 : 0),
            studentsCount: a.studentsCount ?? (a._count?.students || 0),
            studentsLimit: a.studentsLimit ?? (planCode === 'FREE' ? 30 : null),
            sportsCount: a.sportsCount ?? (a._count?.sports || 1),
            groupsCount: a.groupsCount ?? (a._count?.groups || 0),
            staffCount: a.staffCount ?? (a._count?.memberships || 1),
            invoicesThisMonth: a.invoicesThisMonth ?? (a._count?.invoices || 0),
            sunatStatus: a.sunatStatus || ((a.billingSetting?.certPath || a.billingSettings?.certPath) ? 'CONFIGURED_PROD' : 'CONFIGURED_BETA'),
            apiKey: a.apiKey || `live_key_${(a.id || '').substring(0, 8)}`,
            createdAt: typeof a.createdAt === 'string' ? a.createdAt : a.createdAt?.toISOString?.() || new Date().toISOString(),
            lastActiveAt: a.lastActiveAt || 'En línea',
            isSuspended: a.isSuspended ?? (!a.isActive),
          };
        });
        setClients(mappedClients);

        const newProfiles: Record<string, WebAcademyProfile> = {};
        academiesRes.value.forEach((raw: any) => {
          const a = raw.academy || raw;
          if (a.id) {
            const b = a.billingSetting || a.billingSettings;
            newProfiles[a.id] = {
              id: a.id,
              name: a.name,
              legalName: a.legalName || a.name,
              ruc: a.ruc || '20123456789',
              address: a.address || 'Av. Javier Prado Este 2500',
              district: a.city || 'Central',
              city: a.city || 'Lima',
              department: a.department || 'Lima',
              phone: a.phone || '+51 987 654 321',
              whatsapp: a.phone || '+51 987 654 321',
              email: a.email || 'contacto@demo.pe',
              openingHours: 'Lunes a Sábado: 08:00 - 20:00',
              sunatConfig: {
                solUser: b?.solUser || 'MODDATOS',
                solPassConfigured: Boolean(b?.solPassword),
                environment: (b?.environment as any) || 'BETA',
                establishmentCode: b?.establishmentCode || '0000',
                certificateStatus: b?.certPath ? 'VALID' : 'MISSING',
                certificateExpiresAt: '2028-12-31',
                defaultSeriesBoleta: b?.boletaSeries || 'B001',
                defaultSeriesFactura: b?.facturaSeries || 'F001',
              },
            };
          }
        });
        setAcademyProfiles((prev) => ({ ...prev, ...newProfiles }));
      }

      // 16. Staff en tiempo real
      if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value) && staffRes.value.length > 0) {
        setStaff(
          staffRes.value.map((m: any) => ({
            id: m.id,
            name: `${m.user.firstName} ${m.user.lastName}`.trim(),
            dni: m.user.email.split('@')[0],
            email: m.user.email,
            phone: m.user.phone || '+51 900 000 000',
            role: m.role,
            roleTitle: m.role === 'OWNER' ? 'Director General' : m.role === 'CASHIER' ? 'Cajero / Recepción' : m.role === 'COACH' ? 'Entrenador' : 'Administrador',
            sports: ['Fútbol Formativo'],
            joinedDate: new Date(m.createdAt).toISOString().split('T')[0],
            status: m.isActive ? 'ACTIVE' : 'INACTIVE',
          }))
        );
      }

      // 17. Billing Config en tiempo real
      if (billingRes.status === 'fulfilled' && billingRes.value) {
        const b = billingRes.value;
        setAcademyProfiles((prev) => {
          const current = prev[academyId];
          if (!current) return prev;
          return {
            ...prev,
            [academyId]: {
              ...current,
              sunatConfig: {
                ...current.sunatConfig,
                solUser: b.solUser || current.sunatConfig.solUser,
                environment: b.environment || current.sunatConfig.environment,
                establishmentCode: b.establishmentCode || current.sunatConfig.establishmentCode || '0000',
                defaultSeriesBoleta: b.boletaSeries || current.sunatConfig.defaultSeriesBoleta,
                defaultSeriesFactura: b.facturaSeries || current.sunatConfig.defaultSeriesFactura,
              },
            },
          };
        });
      }
    } catch (err: any) {
      console.warn('[AcademyContext] Error sincronizando datos con API:', err.message);
    }
  }, []);

  // Sync client headers with API client & fetch live data on mount / change
  useEffect(() => {
    const initSession = async () => {
      if (!apiClient.getToken()) {
        try {
          const authEmail = currentUser?.email || 'superadmin@gesticlub.pe';
          await apiClient.login(authEmail, 'Admin123!');
        } catch (err: any) {
          console.warn('[AcademyContext] Auto-auth warning:', err.message);
        }
      }
      await loadAcademyData(activeAcademyId);
    };

    initSession();
  }, [activeAcademyId, currentUser, loadAcademyData]);

  // Login Handler
  const handleLogin = (user: DemoUser) => {
    setCurrentUser(user);
    localStorage.setItem('academy_auth_user', JSON.stringify(user));
    if (user.isSuperAdmin) {
      setSuperAdminMode('master');
    } else if (user.memberships && user.memberships.length > 0) {
      const defaultAcademy = user.memberships.find((m) => m.isDefault)?.academyId || user.memberships[0].academyId;
      switchAcademy(defaultAcademy);
      setSuperAdminMode('tenant-impersonation');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    apiClient.setToken(null);
    localStorage.removeItem('academy_auth_user');
    localStorage.removeItem('academy_active_id');
    setCurrentUser(null);
    setSuperAdminMode('master');
  };

  // SuperAdmin handlers
  const handleUpdateClient = (updated: SaaSClientAcademy) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddClient = async (newClient: SaaSClientAcademy) => {
    try {
      if (!apiClient.getToken()) {
        await apiClient.login(currentUser?.email || 'superadmin@gesticlub.pe', 'Admin123!');
      }

      const created = await apiClient.createAcademy({
        name: newClient.name,
        legalName: newClient.legalName,
        ruc: newClient.ruc,
        phone: newClient.phone,
        email: newClient.email,
        address: newClient.address,
        city: newClient.city,
        department: newClient.department,
        slug: newClient.slug,
      });

      // Reload live PostgreSQL data
      await loadAcademyData(activeAcademyId);
      return created;
    } catch (e: any) {
      console.error('Error creando academia en PostgreSQL:', e.message);
      // Fallback local memory if offline
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
            establishmentCode: '0000',
            certificateStatus: 'VALID',
            certificateExpiresAt: '2028-12-31',
            defaultSeriesBoleta: 'B001',
            defaultSeriesFactura: 'F001',
          },
        },
      }));
      throw e;
    }
  };

  const handleEnterAcademyPortal = (academyId: string) => {
    switchAcademy(academyId);
    setSuperAdminMode('tenant-impersonation');
  };

  // Operational Handlers
  const handleAddStudent = async (newStudent: WebStudent) => {
    try {
      const parts = newStudent.name.trim().split(' ');
      const firstName = parts[0] || newStudent.name;
      const lastName = parts.slice(1).join(' ') || 'Alumno';

      await apiClient.createStudent({
        firstName,
        lastName,
        birthDate: newStudent.birthDate || '2015-05-10',
        documentType: newStudent.documentType || 'DNI',
        documentNumber: newStudent.documentNumber,
        emergencyPhone: newStudent.emergencyPhone || newStudent.phone,
        medicalNotes: newStudent.medicalNotes,
        familyId: newStudent.familyId && !newStudent.familyId.startsWith('fam-') ? newStudent.familyId : undefined,
        familyName: newStudent.familyName,
        groupName: newStudent.groupName,
        monthlyFee: newStudent.monthlyFee,
        scholarshipType: newStudent.scholarshipType,
        scholarshipDiscountPct: newStudent.scholarshipDiscountPct,
        scholarshipFixedDiscount: newStudent.scholarshipFixedDiscount,
        scholarshipReason: newStudent.scholarshipReason,
        scholarshipApprovedBy: newStudent.scholarshipApprovedBy,
      });

      await loadAcademyData(activeAcademyId);
    } catch (err: any) {
      console.warn('Guardando estudiante localmente tras error API:', err.message);
      setStudents((prev) => [newStudent, ...prev]);
    }
  };

  const handleAddFamily = async (newFamily: WebFamily) => {
    try {
      const primary = newFamily.contacts?.[0];
      await apiClient.createFamily({
        name: newFamily.name,
        code: newFamily.code,
        notes: newFamily.notes,
        contacts: primary
          ? [
              {
                relationship: primary.relationship || 'PADRE',
                fullName: primary.fullName,
                phone: primary.phone,
                email: primary.email,
                documentNumber: primary.documentNumber,
                isPrimary: true,
              },
            ]
          : [],
      });

      await loadAcademyData(activeAcademyId);
    } catch (err: any) {
      console.warn('Guardando familia localmente tras error API:', err.message);
      setFamilies((prev) => [newFamily, ...prev]);
    }
  };

  const handleUpdateFamily = async (updatedFamily: WebFamily) => {
    try {
      if (!updatedFamily.id.startsWith('fam-local-')) {
        await apiClient.updateFamily(updatedFamily.id, {
          name: updatedFamily.name,
          notes: updatedFamily.notes,
        });
      }
      await loadAcademyData(activeAcademyId);
    } catch (err: any) {
      console.warn('Actualizando familia localmente tras error API:', err.message);
      setFamilies((prev) => prev.map((f) => (f.id === updatedFamily.id ? updatedFamily : f)));
    }
  };

  const handleUpdateSession = async (updatedSession: WebClassSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
    setSelectedSession(updatedSession);

    try {
      if (updatedSession.attendances && updatedSession.attendances.length > 0) {
        const records = updatedSession.attendances.map((a) => ({
          studentId: a.studentId,
          status: a.status,
          checkInTime: a.checkInTime,
          remarks: a.remarks,
          justificationReason: a.justificationReason,
        }));
        await apiClient.saveAttendance(updatedSession.id, records);
      }
    } catch (err: any) {
      console.warn('Error guardando asistencia en backend:', err.message);
    }
  };

  const handleRegisterPayment = async (newPayment: WebPayment, newInvoice?: WebBillingInvoice) => {
    try {
      const paymentPayload = {
        studentId: newPayment.studentId && !newPayment.studentId.startsWith('stu-') ? newPayment.studentId : undefined,
        familyId: newPayment.familyId && !newPayment.familyId.startsWith('fam-') ? newPayment.familyId : undefined,
        amount: newPayment.amount,
        paymentMethod: newPayment.paymentMethod,
        referenceNumber: newPayment.referenceNumber,
        notes: newPayment.description,
        allocations: newPayment.allocations?.map((a) => ({
          chargeId: a.chargeId,
          amount: a.amount,
        })),
      };

      const res = await apiClient.createPayment(paymentPayload);

      if (newInvoice) {
        await apiClient
          .emitInvoice({
            invoiceType: newInvoice.type,
            series: newInvoice.series,
            clientName: newInvoice.clientName,
            clientDocNum: newInvoice.clientDoc,
            paymentId: res?.payment?.id || undefined,
            items: newInvoice.items || [
              {
                description: newPayment.description || 'Pensión Formativa',
                quantity: 1,
                unitPrice: newPayment.amount,
              },
            ],
          })
          .catch((e) => console.warn('Factura emitida localmente:', e.message));
      }

      await loadAcademyData(activeAcademyId);
    } catch (err: any) {
      console.warn('Registrando pago localmente tras error API:', err.message);
      setPayments((prev) => [newPayment, ...prev]);
      if (newInvoice) {
        setInvoices((prev) => [newInvoice, ...prev]);
      }

      if (newPayment.allocations && newPayment.allocations.length > 0) {
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
      }
    }
  };

  const handleEmitInvoiceForPayment = async (
    payment: WebPayment,
    invoiceType: 'RECIBO' | 'BOLETA' | 'FACTURA' = 'RECIBO'
  ) => {
    try {
      const isRecibo = invoiceType === 'RECIBO';
      const series = isRecibo
        ? 'R001'
        : invoiceType === 'FACTURA'
        ? activeAcademy.sunatConfig.defaultSeriesFactura || 'F001'
        : activeAcademy.sunatConfig.defaultSeriesBoleta || 'B001';

      await apiClient.emitInvoice({
        invoiceType,
        series,
        clientName: payment.studentName.toUpperCase(),
        clientDocNum: '74829103',
        paymentId: payment.id,
        items: [
          {
            description: payment.description || 'Pensión Deportiva Formativa',
            quantity: 1,
            unitPrice: payment.amount,
          },
        ],
      });

      await loadAcademyData(activeAcademyId);
    } catch (err: any) {
      console.warn('Error emitiendo comprobante en backend:', err.message);
      const isRecibo = invoiceType === 'RECIBO';
      const series = isRecibo
        ? 'R001'
        : invoiceType === 'FACTURA'
        ? activeAcademy.sunatConfig.defaultSeriesFactura || 'F001'
        : activeAcademy.sunatConfig.defaultSeriesBoleta || 'B001';

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
          : `Comprobante ${invNum} emitido.`,
        issuedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        concept: payment.description,
        paymentMethod: payment.paymentMethod,
        receivedBy: payment.receivedBy,
        isInternalReceipt: isRecibo,
      };

      setInvoices((prev) => [newInvoice, ...prev]);
    }
  };

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

  const handleAddRefund = async (newRefund: WebRefund, paymentId: string) => {
    try {
      await apiClient.createRefund({
        paymentId,
        amount: newRefund.amount,
        reason: newRefund.reason,
        refundMethod: newRefund.refundMethod,
      });
      await loadAcademyData(activeAcademyId);
    } catch (err: any) {
      console.warn('Reembolso local tras error API:', err.message);
      setRefunds((prev) => [newRefund, ...prev]);
    }
  };

  const handleAddPackageCredit = (newPkgCredit: WebPackageCredit) => {
    setPackageCredits((prev) => [newPkgCredit, ...prev]);
  };

  const handleConvertTrial = async (trialId: string) => {
    try {
      await apiClient.convertTrial(trialId);
      await loadAcademyData(activeAcademyId);
    } catch (err: any) {
      console.warn('Conversión de trial local:', err.message);
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
    }
  };

  const handleAddPackage = async (newPkg: WebPackage) => {
    try {
      await apiClient.createPackage({
        name: newPkg.name,
        classCount: newPkg.classCount,
        bonusClasses: newPkg.bonusClasses,
        price: newPkg.price,
        validityDays: newPkg.validityDays,
      });
      await loadAcademyData(activeAcademyId);
    } catch (err: any) {
      console.warn('Paquete local tras error API:', err.message);
      setPackages((prev) => [newPkg, ...prev]);
    }
  };

  const handleAddPromotion = async (newPromo: WebPromotion) => {
    try {
      await apiClient.createPromotion({
        code: newPromo.code,
        name: newPromo.name,
        description: newPromo.description,
        discountPct: newPromo.discountPct,
        discountFixed: newPromo.discountFixed,
        bonusClasses: newPromo.bonusClasses,
        startDate: newPromo.startDate,
        endDate: newPromo.endDate,
      });
      await loadAcademyData(activeAcademyId);
    } catch (err: any) {
      console.warn('Promoción local tras error API:', err.message);
      setPromotions((prev) => [newPromo, ...prev]);
    }
  };

  const handleUpdateProfile = async (updatedProfile: WebAcademyProfile) => {
    setAcademyProfiles((prev) => ({
      ...prev,
      [updatedProfile.id]: updatedProfile,
    }));

    try {
      // Sync SUNAT & multi-establishment config with backend
      if (updatedProfile.sunatConfig) {
        await apiClient.updateBillingConfig(updatedProfile.id, {
          solUser: updatedProfile.sunatConfig.solUser,
          solPassword: updatedProfile.sunatConfig.solPassword,
          environment: updatedProfile.sunatConfig.environment,
          establishmentCode: updatedProfile.sunatConfig.establishmentCode || '0000',
          boletaSeries: updatedProfile.sunatConfig.defaultSeriesBoleta || 'B001',
          facturaSeries: updatedProfile.sunatConfig.defaultSeriesFactura || 'F001',
        });
      }
    } catch (e: any) {
      console.warn('Error actualizando configuración de sede en backend:', e.message);
    }
  };

  const handleToggleSportStatus = (id: string) => {
    setSports((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)));
  };

  const handleAddSport = async (sport: WebSportItem) => {
    try {
      await apiClient.createSport({ name: sport.name, description: sport.description });
      await loadAcademyData(activeAcademyId);
    } catch (e: any) {
      console.warn('Deporte local:', e.message);
      setSports((prev) => [...prev, sport]);
    }
  };

  const handleAddStaffMember = async (member: WebStaffMember) => {
    try {
      await apiClient.addStaff(activeAcademyId, {
        email: member.email,
        role: member.role,
        firstName: member.name.split(' ')[0] || member.name,
        lastName: member.name.split(' ').slice(1).join(' ') || 'Staff',
      });
      await loadAcademyData(activeAcademyId);
    } catch (e: any) {
      console.warn('Staff local:', e.message);
      setStaff((prev) => [...prev, member]);
    }
  };

  const handleRemoveStaffMember = async (membershipId: string) => {
    try {
      await apiClient.removeStaff(activeAcademyId, membershipId);
      await loadAcademyData(activeAcademyId);
    } catch (e: any) {
      console.warn('Eliminación staff local:', e.message);
      setStaff((prev) => prev.filter((s) => s.id !== membershipId));
    }
  };

  const handleAddTariff = (tariff: WebFeeTariff) => {
    setTariffs((prev) => [...prev, tariff]);
  };

  const handleUpgradeToPro = async () => {
    try {
      await apiClient.upgradeSubscription('PRO');
      await loadAcademyData(activeAcademyId);
    } catch (e: any) {
      console.warn('Upgrade local tras error API:', e.message);
      setSubscription((prev) => ({
        ...prev,
        plan: { code: 'PRO', name: 'Plan PRO', priceMonthly: 99.0, currency: 'PEN' },
        status: 'ACTIVE',
        trial: { ...prev.trial, active: false },
        limits: { students: null, groups: null, sports: null, users: null },
        overLimit: false,
        features: { sunatBilling: true, whatsappAutomation: true, unlimitedStudents: true },
      }));
    }
    setIsSubscriptionModalOpen(false);
  };

  const handleDowngradeToFree = async () => {
    try {
      await apiClient.downgradeSubscription();
      await loadAcademyData(activeAcademyId);
    } catch (e: any) {
      console.warn('Downgrade local tras error API:', e.message);
      setSubscription((prev) => ({
        ...prev,
        plan: { code: 'FREE', name: 'Plan Free', priceMonthly: 0.0, currency: 'PEN' },
        status: 'ACTIVE',
        trial: { ...prev.trial, active: false, remainingDays: 0 },
        limits: { students: 30, groups: 2, sports: 1, users: 2 },
        overLimit: students.length > 30,
        features: { sunatBilling: false, whatsappAutomation: false, unlimitedStudents: false },
      }));
    }
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

  return (
    <AcademyContext.Provider
      value={{
        currentUser,
        handleLogin,
        handleLogout,
        activeAcademyId,
        activeAcademy,
        authorizedAcademiesList,
        switchAcademy,
        academyProfiles,
        setAcademyProfiles,
        superAdminMode,
        setSuperAdminMode,
        clients,
        handleAddClient,
        handleUpdateClient,
        handleEnterAcademyPortal,
        subscription,
        isSubscriptionModalOpen,
        setIsSubscriptionModalOpen,
        handleUpgradeToPro,
        handleDowngradeToFree,
        handleSimulateExpireTrial,
        students,
        handleAddStudent,
        families,
        handleAddFamily,
        handleUpdateFamily,
        groups,
        sessions,
        selectedSession,
        setSelectedSession,
        handleUpdateSession,
        charges,
        payments,
        handleRegisterPayment,
        invoices,
        setInvoices,
        handleEmitInvoiceForPayment,
        customerCredits,
        handleAddCustomerCredit,
        handleApplyCustomerCredit,
        refunds,
        handleAddRefund,
        packages,
        handleAddPackage,
        packageCredits,
        handleAddPackageCredit,
        handleConsumePackageCredit,
        trials,
        handleConvertTrial,
        promotions,
        handleAddPromotion,
        academyPolicy,
        sports,
        setSports,
        handleToggleSportStatus,
        handleAddSport,
        staff,
        setStaff,
        handleAddStaffMember,
        handleRemoveStaffMember,
        tariffs,
        setTariffs,
        handleAddTariff,
        preselectedStudent,
        setPreselectedStudent,
        preselectedFamily,
        setPreselectedFamily,
        loadAcademyData,
        handleUpdateProfile,
      }}
    >
      {children}
    </AcademyContext.Provider>
  );
};

export const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (!context) {
    throw new Error('useAcademy must be used within an AcademyProvider');
  }
  return context;
};
