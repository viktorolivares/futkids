import React, { useState } from 'react';
import {
  Activity,
  Terminal,
  Database,
  CheckCircle2,
  Server,
  DollarSign,
  Copy,
  Check,
  X,
  Send,
  Building2,
  Sparkles,
  Layers,
  ExternalLink,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  DemoUser,
  AppMode,
  SandboxTabType,
  SaaSClientAcademy,
  SubscriptionStatusInfo,
} from './types';
import { DEMO_USERS, DEMO_ACADEMIES } from './data/mockApiData';
import { INITIAL_SAAS_CLIENTS } from './data/mockClientsData';
import { Header } from './components/Header';
import { SaaSClientAdmin } from './components/SaaSClientAdmin';
import { ApiConsoleView } from './components/ApiConsoleView';
import { SunatTester } from './components/SunatTester';
import MobileApp from '../academy-mobile/src/App';

export default function App() {
  // Current active mode: 'clients-admin' (Panel de Administración de Mis Clientes) or 'api-sandbox' (API Sandbox & SUNAT)
  const [appMode, setAppMode] = useState<AppMode>('clients-admin');
  const [sandboxSubTab, setSandboxSubTab] = useState<'api-console' | 'sunat-sandbox' | 'health'>('api-console');

  // SaaS Clients state (Tenants Management)
  const [clients, setClients] = useState<SaaSClientAcademy[]>(INITIAL_SAAS_CLIENTS);

  // Authentication and Tenant Context
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[0]);
  const [activeAcademyId, setActiveAcademyId] = useState<string>(
    DEMO_USERS[0].memberships[0]?.academyId || DEMO_ACADEMIES[0].id,
  );

  // Modals & UI Feedback
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Active client object for current tenant
  const activeClient = clients.find((c) => c.id === activeAcademyId) || clients[0];

  // Derived SaaS subscription representation for header badge
  const subscription: SubscriptionStatusInfo = {
    plan: {
      code: activeClient?.plan === 'FREE' ? 'FREE' : 'PRO',
      name: activeClient?.plan || 'PRO',
      priceMonthly: activeClient?.mrr || 99.0,
      currency: 'PEN',
    },
    status: activeClient?.planStatus === 'TRIALING' ? 'TRIALING' : 'ACTIVE',
    trial: {
      active: activeClient?.planStatus === 'TRIALING',
      startsAt: activeClient?.createdAt || null,
      endsAt: activeClient?.trialEndsAt || null,
      remainingDays: activeClient?.trialDaysLeft || 0,
    },
    limits: {
      students: activeClient?.studentsLimit || null,
      groups: null,
      sports: null,
      users: null,
    },
    usage: {
      students: activeClient?.studentsCount || 0,
      groups: activeClient?.groupsCount || 0,
      sports: activeClient?.sportsCount || 0,
      users: activeClient?.staffCount || 0,
    },
    overLimit:
      activeClient?.studentsLimit !== null &&
      activeClient?.studentsCount >= (activeClient?.studentsLimit || 30),
    features: {
      SUNAT_BILLING: activeClient?.plan !== 'FREE',
      WHATSAPP_ALERTS: activeClient?.plan !== 'FREE',
      ADVANCED_METRICS: activeClient?.plan === 'ENTERPRISE',
      MULTI_SEDE: activeClient?.plan === 'ENTERPRISE',
    },
  };

  const handleUpdateClient = (updated: SaaSClientAcademy) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setToastMessage(`Academia "${updated.name}" actualizada con éxito.`);
  };

  const handleAddClient = (newClient: SaaSClientAcademy) => {
    setClients((prev) => [newClient, ...prev]);
    setActiveAcademyId(newClient.id);
    setToastMessage(`Nueva academia "${newClient.name}" registrada con 14 días de prueba PRO.`);
  };

  const handleSelectClientForApiTesting = (academyId: string) => {
    setActiveAcademyId(academyId);
    setAppMode('api-sandbox');
    setSandboxSubTab('api-console');
    const target = clients.find((c) => c.id === academyId);
    setToastMessage(`Contexto de API configurado para: ${target?.name || academyId}`);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(
      `curl -X GET "https://api.academy.pe/api/v1/health" \\\n  -H "x-academy-id: ${activeAcademyId}" \\\n  -H "Authorization: Bearer mock_jwt_token"`,
    );
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Top Header with live telemetry and tenant context switcher */}
      <Header
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        activeAcademyId={activeAcademyId}
        onSelectAcademy={setActiveAcademyId}
        systemHealthy={true}
        onOpenQuickHealth={() => setShowHealthModal(true)}
        subscription={subscription}
        currentMode={appMode}
        onSelectMode={setAppMode}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white shadow-xl rounded-2xl px-5 py-3.5 text-sm font-medium flex items-center gap-3 animate-fade-in border border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-lg font-bold p-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Subheader Navigation Bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 md:top-[85px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto py-2.5">
          {appMode === 'mobile-field' ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 font-semibold rounded-xl text-xs sm:text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  App Móvil de Campo
                </span>
                <span className="text-slate-500 text-xs sm:text-sm hidden md:inline">
                  Control en cancha para asistencia, pagos y reprogramaciones rápidas
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAppMode('clients-admin')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span>Volver a Mis Academias</span>
                </button>
              </div>
            </div>
          ) : appMode === 'clients-admin' ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm">
                  <Building2 className="w-4 h-4 text-slate-700" />
                  Panel Principal de Academias
                </span>
                <span className="text-slate-500 text-xs sm:text-sm hidden md:inline">
                  {clients.length} sedes y academias operando en tiempo real
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setAppMode('mobile-field')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>Ver App Móvil</span>
                </button>
                <button
                  onClick={() => setAppMode('api-sandbox')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-slate-600" />
                  <span>Consola Técnica</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <nav className="flex space-x-2">
                {[
                  { id: 'api-console', label: 'Consola API & Endpoints', icon: Terminal },
                  { id: 'sunat-sandbox', label: 'Emisión SUNAT Beta', icon: Send },
                  { id: 'health', label: 'Telemetría & Diagnóstico', icon: Activity },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = sandboxSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSandboxSubTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={() => setAppMode('clients-admin')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-slate-600" />
                <span>Volver a Mis Academias</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* MODO 1: PANEL DE ADMINISTRACIÓN DE MIS CLIENTES */}
        {appMode === 'clients-admin' && (
          <SaaSClientAdmin
            clients={clients}
            onUpdateClient={handleUpdateClient}
            onAddClient={handleAddClient}
            onSelectClientForApiTesting={handleSelectClientForApiTesting}
          />
        )}

        {/* MODO 2: APP MÓVIL DE CAMPO (APK PREVIEW) */}
        {appMode === 'mobile-field' && (
          <div className="w-full">
            <MobileApp />
          </div>
        )}

        {/* MODO 3: API SANDBOX & SUNAT TOOLS */}
        {appMode === 'api-sandbox' && (
          <div className="space-y-6">
            {sandboxSubTab === 'api-console' && (
              <ApiConsoleView
                currentUser={currentUser}
                activeAcademyId={activeAcademyId}
              />
            )}

            {sandboxSubTab === 'sunat-sandbox' && (
              <div className="space-y-6">
                <div className="bg-white border border-amber-200/80 rounded-2xl p-5 sm:p-6 text-sm text-slate-700 flex items-start gap-4 shadow-xs">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Transmisión Electrónica SUNAT UBL 2.1 (Entorno Beta)
                    </h3>
                    <p className="mt-1 text-slate-600 leading-relaxed text-sm">
                      Módulo de prueba para el ciclo completo de facturación: generación del XML estándar SUNAT,
                      firma digital RSA-SHA256, compresión ZIP en Base64, envío a los WebServices SOAP oficiales y
                      recepción inmediata de la Constancia de Recepción (CDR).
                    </p>
                  </div>
                </div>
                <SunatTester />
              </div>
            )}

            {sandboxSubTab === 'health' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Diagnóstico y Salud de los Servicios
                      </h2>
                      <p className="text-sm text-slate-500">
                        Monitoreo continuo de base de datos PostgreSQL, colas Redis y conexión SUNAT.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Todos los servicios operativos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base de Datos</span>
                    <div className="text-slate-900 font-bold flex items-center gap-2 text-base">
                      <Database className="w-5 h-5 text-emerald-600" /> PostgreSQL 16
                    </div>
                    <span className="text-xs text-slate-600 block">Aislamiento por academia activo y seguro</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Memoria y Colas</span>
                    <div className="text-slate-900 font-bold flex items-center gap-2 text-base">
                      <Server className="w-5 h-5 text-emerald-600" /> Redis 7 + BullMQ
                    </div>
                    <span className="text-xs text-slate-600 block">Sincronización y notificaciones en segundo plano</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Moneda y Precisión</span>
                    <div className="text-slate-900 font-bold flex items-center gap-2 text-base">
                      <DollarSign className="w-5 h-5 text-emerald-600" /> Soles (S/)
                    </div>
                    <span className="text-xs text-slate-600 block">Cálculos con exactitud contable DECIMAL(10,2)</span>
                  </div>
                </div>

                <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl">
                  <span className="text-xs text-slate-400 font-medium block mb-2">
                    Respuesta del servidor (/api/v1/health):
                  </span>
                  <pre className="text-xs font-mono text-emerald-400 overflow-x-auto p-3 bg-slate-950/80 rounded-xl leading-relaxed">
{JSON.stringify(
  {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: 86420,
    activeAcademy: activeAcademyId,
    academyName: activeClient?.name,
    tenantPlan: activeClient?.plan,
    trialDaysRemaining: activeClient?.trialDaysLeft,
    services: {
      postgres: 'connected',
      redis: 'connected',
      bullmq: 'running',
      sunatSoapProxy: 'online',
    },
  },
  null,
  2,
)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* High Density Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-4 px-6 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span>Sistema Multi-Academia</span>
            <span>•</span>
            <span>Facturación SUNAT en Soles (S/)</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Base de datos PostgreSQL + Redis</span>
          </div>
          <div className="text-slate-400 text-xs">
            Diseñado para brindar tranquilidad y agilidad en la gestión deportiva.
          </div>
        </div>
      </footer>

      {/* Quick Health Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Telemetría del Sistema
                  </h3>
                  <p className="text-xs text-slate-500">GET /api/v1/health</p>
                </div>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl text-xs text-slate-200">
              <pre className="text-emerald-400 overflow-x-auto max-h-72 leading-relaxed font-mono">
{JSON.stringify(
  {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: 14280,
    environment: 'development',
    version: '1.0.0',
    services: {
      database: {
        status: 'connected',
        latencyMs: 14,
        type: 'PostgreSQL 16 (Prisma Multi-Tenant RLS)',
      },
      redis: {
        status: 'connected',
        response: 'PONG',
      },
      bullmq: {
        status: 'active',
        queues: {
          billing: { waiting: 0, active: 0 },
          whatsapp: { waiting: 0, active: 0 },
          email: { waiting: 0, active: 0 },
          documents: { waiting: 0, active: 0 },
          reports: { waiting: 0, active: 0 },
          reminders: { waiting: 1, active: 0 },
        },
      },
      sunatBeta: {
        status: 'connected',
        endpoint: 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
        ublVersion: '2.1',
      },
    },
  },
  null,
  2,
)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyCurl}
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition font-medium cursor-pointer"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Comando Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copiar cURL</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowHealthModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
