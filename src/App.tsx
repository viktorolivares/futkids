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
    <div className="min-h-screen bg-[#0B0E14] text-slate-300 flex flex-col font-sans selection:bg-sky-500 selection:text-black">
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
        <div className="fixed bottom-5 right-5 z-50 bg-[#161B22] border border-sky-500/60 shadow-2xl rounded-lg px-4 py-3 text-xs font-mono text-white flex items-center gap-3 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></div>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Subheader Navigation Bar */}
      <div className="bg-[#161B22] border-b border-slate-800 sticky top-[77px] z-40">
        <div className="max-w-7xl mx-auto px-3 flex items-center justify-between overflow-x-auto">
          {appMode === 'mobile-field' ? (
            <div className="flex items-center justify-between w-full py-2">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-400 text-black font-bold rounded uppercase">
                  <Smartphone className="w-3.5 h-3.5" />
                  App Móvil de Campo (academy-mobile APK)
                </span>
                <span className="text-slate-400 hidden md:inline">
                  • Herramienta de campo para Dueño, Encargado y Cajero (Pase de lista 30s, Suspensión/Reprogramación, Semáforo de deuda, Yape)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAppMode('clients-admin')}
                  className="px-2.5 py-1 rounded bg-[#0D1117] hover:bg-slate-800 text-sky-400 border border-sky-500/30 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition"
                >
                  <Building2 className="w-3 h-3" />
                  <span>Volver a Mis Clientes</span>
                </button>
              </div>
            </div>
          ) : appMode === 'clients-admin' ? (
            <div className="flex items-center justify-between w-full py-2">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-500 text-black font-bold rounded uppercase">
                  <Building2 className="w-3.5 h-3.5" />
                  Panel de Administración de Mis Clientes
                </span>
                <span className="text-slate-400 hidden md:inline">
                  • Gestión de {clients.length} academias deportivas, planes y cuotas multi-tenant
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAppMode('mobile-field')}
                  className="px-2.5 py-1 rounded bg-[#0D1117] hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Ver App Móvil</span>
                </button>
                <button
                  onClick={() => setAppMode('api-sandbox')}
                  className="px-2.5 py-1 rounded bg-[#0D1117] hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition"
                >
                  <Terminal className="w-3 h-3" />
                  <span>Ir al API Sandbox</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full py-1.5">
              <nav className="flex space-x-1">
                {[
                  { id: 'api-console', label: 'Consola API & Swagger', icon: Terminal },
                  { id: 'sunat-sandbox', label: 'Transmisor SOAP SUNAT Beta', icon: Send },
                  { id: 'health', label: 'Telemetría & Healthcheck', icon: Activity },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = sandboxSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSandboxSubTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold whitespace-nowrap transition ${
                        isActive
                          ? 'bg-amber-400 text-black shadow-sm font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={() => setAppMode('clients-admin')}
                className="px-2.5 py-1 rounded bg-[#0D1117] hover:bg-slate-800 text-sky-400 border border-sky-500/30 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition"
              >
                <Building2 className="w-3 h-3" />
                <span>Volver a Mis Clientes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
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

        {/* MODO 2: API SANDBOX & SUNAT TOOLS */}
        {appMode === 'api-sandbox' && (
          <div className="space-y-4">
            {sandboxSubTab === 'api-console' && (
              <ApiConsoleView
                currentUser={currentUser}
                activeAcademyId={activeAcademyId}
              />
            )}

            {sandboxSubTab === 'sunat-sandbox' && (
              <div className="space-y-4">
                <div className="bg-[#0F1219] border border-amber-500/40 rounded-xl p-4 font-mono text-xs text-amber-200 flex items-start gap-3">
                  <Send className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white uppercase block">
                      Probador Independiente de Transmisión SOAP UBL 2.1 (SUNAT Beta)
                    </strong>
                    <p className="mt-1 text-slate-300">
                      Este módulo permite probar el ciclo completo de facturación electrónica para cualquier academia:
                      Generación de XML con firma digital RSA-SHA256, empaquetado ZIP en Base64, envío a
                      WebServices SOAP de SUNAT y decodificación inmediata del CDR oficial con Hash SHA-256.
                    </p>
                  </div>
                </div>
                <SunatTester />
              </div>
            )}

            {sandboxSubTab === 'health' && (
              <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-5 font-mono space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase">
                        Diagnóstico y Telemetría del Sistema (Backend & Base de Datos)
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Estado de microservicios, aislamiento multi-tenant RLS y colas BullMQ.
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded text-[11px] font-bold">
                    TODO OPERATIVO
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#161B22] border border-slate-800 rounded-lg space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">MOTOR DE BASE DE DATOS</span>
                    <div className="text-white font-bold flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-sky-400" /> PostgreSQL 16 (RLS Habilitado)
                    </div>
                    <span className="text-[10px] text-emerald-400">Conexiones activas: 4/20</span>
                  </div>

                  <div className="p-3 bg-[#161B22] border border-slate-800 rounded-lg space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">COLAS EN MEMORIA</span>
                    <div className="text-white font-bold flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-amber-400" /> Redis 7 + BullMQ
                    </div>
                    <span className="text-[10px] text-sky-400">Worker de suscripciones y SUNAT activo</span>
                  </div>

                  <div className="p-3 bg-[#161B22] border border-slate-800 rounded-lg space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">MONEDA BASE PERÚ</span>
                    <div className="text-white font-bold flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Soles PEN (S/) DECIMAL(10, 2)
                    </div>
                    <span className="text-[10px] text-slate-400">Sin pérdidas por coma flotante</span>
                  </div>
                </div>

                <div className="p-3 bg-[#090B10] border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">
                    JSON RESPONSE: /api/v1/health (Tenant: {activeAcademyId})
                  </span>
                  <pre className="text-[11px] text-emerald-400 bg-black/40 p-3 rounded overflow-x-auto">
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
      <footer className="bg-[#090B10] border-t border-slate-800 text-slate-500 py-2.5 px-3 text-[10px] font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400 uppercase">ACADEMY API PLATFORM</span>
            <span>•</span>
            <span>MULTI-TENANT SAAS</span>
            <span>•</span>
            <span className="text-emerald-400">DECIMAL(10, 2) PEN</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 uppercase">
            <span>POSTGRESQL 16</span>
            <span>REDIS 7</span>
            <span>BULLMQ</span>
            <span>NESTJS 10</span>
            <span className="text-sky-400">SUNAT UBL 2.1 BETA</span>
          </div>
        </div>
      </footer>

      {/* Quick Health Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-800 rounded-xl max-w-lg w-full p-4 shadow-2xl space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  GET /api/v1/health — Live Telemetry
                </h3>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#090B10] p-3 rounded border border-slate-800 text-[11px] text-slate-200">
              <pre className="text-emerald-400 overflow-x-auto max-h-72">
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

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleCopyCurl}
                className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white px-2.5 py-1 rounded bg-[#161B22] border border-slate-700 transition"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 uppercase">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="uppercase">Copiar cURL</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowHealthModal(false)}
                className="bg-sky-500 hover:bg-sky-400 text-black text-[10px] font-bold px-3 py-1 rounded transition uppercase"
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
