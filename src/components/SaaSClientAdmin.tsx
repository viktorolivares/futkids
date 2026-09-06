import React, { useState } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Zap,
  Key,
  Copy,
  Check,
  ChevronRight,
  Plus,
  ExternalLink,
  Sliders,
  DollarSign,
  TrendingUp,
  FileText,
  Activity,
  X,
  Lock,
  PauseCircle,
  PlayCircle,
  Calendar,
  Layers,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { SaaSClientAcademy } from '../types';

interface SaaSClientAdminProps {
  clients: SaaSClientAcademy[];
  onUpdateClient: (updated: SaaSClientAcademy) => void;
  onAddClient: (newClient: SaaSClientAcademy) => void;
  onSelectClientForApiTesting: (academyId: string) => void;
}

export const SaaSClientAdmin: React.FC<SaaSClientAdminProps> = ({
  clients,
  onUpdateClient,
  onAddClient,
  onSelectClientForApiTesting,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'TRIAL' | 'PRO' | 'FREE' | 'ENTERPRISE' | 'OVER_LIMIT'>('ALL');
  const [selectedClient, setSelectedClient] = useState<SaaSClientAcademy | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New Client Form state
  const [newForm, setNewForm] = useState({
    name: '',
    legalName: '',
    ruc: '',
    address: '',
    city: 'Lima',
    department: 'Lima',
    phone: '+51 ',
    email: '',
    contactPerson: '',
    sportName: 'Fútbol',
  });

  // Calculate SaaS Global Metrics
  const totalClients = clients.length;
  const trialClients = clients.filter((c) => c.planStatus === 'TRIALING').length;
  const proClients = clients.filter((c) => c.plan === 'PRO' && c.planStatus === 'ACTIVE').length;
  const enterpriseClients = clients.filter((c) => c.plan === 'ENTERPRISE' && c.planStatus === 'ACTIVE').length;
  const freeClients = clients.filter((c) => c.plan === 'FREE').length;

  const totalMrr = clients.reduce((acc, c) => {
    if (c.planStatus === 'ACTIVE' || c.planStatus === 'TRIALING') {
      return acc + (c.mrr || 0);
    }
    return acc;
  }, 0);

  const totalStudents = clients.reduce((acc, c) => acc + c.studentsCount, 0);
  const totalInvoices = clients.reduce((acc, c) => acc + c.invoicesThisMonth, 0);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ruc.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'TRIAL') return c.planStatus === 'TRIALING';
    if (filterStatus === 'PRO') return c.plan === 'PRO';
    if (filterStatus === 'FREE') return c.plan === 'FREE';
    if (filterStatus === 'ENTERPRISE') return c.plan === 'ENTERPRISE';
    if (filterStatus === 'OVER_LIMIT') {
      return c.studentsLimit !== null && c.studentsCount >= c.studentsLimit * 0.9;
    }

    return true;
  });

  const handleCopyApiKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleExtendTrial = (client: SaaSClientAcademy, extraDays: number) => {
    const currentDays = client.trialDaysLeft || 0;
    const newDays = currentDays + extraDays;
    const endsAt = new Date(Date.now() + newDays * 86400000).toISOString();

    const updated: SaaSClientAcademy = {
      ...client,
      plan: 'PRO',
      planStatus: 'TRIALING',
      trialDaysLeft: newDays,
      trialEndsAt: endsAt,
    };
    onUpdateClient(updated);
    if (selectedClient?.id === client.id) {
      setSelectedClient(updated);
    }
  };

  const handleChangePlan = (client: SaaSClientAcademy, newPlan: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    let mrr = 0;
    let studentsLimit: number | null = null;
    let sportsLimit = null;

    if (newPlan === 'FREE') {
      mrr = 0;
      studentsLimit = 30;
    } else if (newPlan === 'PRO') {
      mrr = 99;
      studentsLimit = null;
    } else if (newPlan === 'ENTERPRISE') {
      mrr = 249;
      studentsLimit = null;
    }

    const updated: SaaSClientAcademy = {
      ...client,
      plan: newPlan,
      planStatus: 'ACTIVE',
      trialDaysLeft: 0,
      trialEndsAt: null,
      mrr,
      studentsLimit,
    };
    onUpdateClient(updated);
    if (selectedClient?.id === client.id) {
      setSelectedClient(updated);
    }
  };

  const handleToggleSuspension = (client: SaaSClientAcademy) => {
    const updated: SaaSClientAcademy = {
      ...client,
      isSuspended: !client.isSuspended,
      planStatus: !client.isSuspended ? 'SUSPENDED' : client.plan === 'FREE' ? 'ACTIVE' : 'ACTIVE',
    };
    onUpdateClient(updated);
    if (selectedClient?.id === client.id) {
      setSelectedClient(updated);
    }
  };

  const handleRegenerateApiKey = (client: SaaSClientAcademy) => {
    const prefix = client.planStatus === 'TRIALING' ? 'sk_test_' : 'sk_live_';
    const randomHex = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 10);
    const newKey = `${prefix}${client.slug.substring(0, 8)}_${randomHex}`;

    const updated: SaaSClientAcademy = {
      ...client,
      apiKey: newKey,
    };
    onUpdateClient(updated);
    if (selectedClient?.id === client.id) {
      setSelectedClient(updated);
    }
  };

  const handleCreateNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name || !newForm.ruc || newForm.ruc.length !== 11) {
      alert('Por favor ingresa un nombre válido y un RUC de 11 dígitos.');
      return;
    }

    const slug = newForm.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newId = `acad-${slug.substring(0, 10)}-${Math.floor(10 + Math.random() * 90)}`;
    const randomKey = `sk_test_${slug.substring(0, 8)}_${Math.random().toString(36).substring(2, 15)}`;

    const newClient: SaaSClientAcademy = {
      id: newId,
      slug,
      name: newForm.name,
      legalName: newForm.legalName || newForm.name.toUpperCase() + ' S.A.C.',
      ruc: newForm.ruc,
      address: newForm.address || 'Av. Principal 123',
      city: newForm.city,
      department: newForm.department,
      phone: newForm.phone,
      email: newForm.email || `contacto@${slug}.pe`,
      contactPerson: newForm.contactPerson || 'Administrador Sede',
      plan: 'PRO',
      planStatus: 'TRIALING',
      trialDaysLeft: 14,
      trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      mrr: 99.0,
      studentsCount: 0,
      studentsLimit: null,
      sportsCount: 1,
      groupsCount: 0,
      staffCount: 1,
      invoicesThisMonth: 0,
      sunatStatus: 'CONFIGURED_BETA',
      apiKey: randomKey,
      createdAt: new Date().toISOString(),
      lastActiveAt: 'Recién registrado',
      isSuspended: false,
    };

    onAddClient(newClient);
    setIsNewClientModalOpen(false);
    setSelectedClient(newClient);
    setNewForm({
      name: '',
      legalName: '',
      ruc: '',
      address: '',
      city: 'Lima',
      department: 'Lima',
      phone: '+51 ',
      email: '',
      contactPerson: '',
      sportName: 'Fútbol',
    });
  };

  return (
    <div className="space-y-8 text-slate-700">
      {/* 1. Header & Primary Action */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Gestión de Academias Deportivas
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Multi-Sede Activo
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            Supervisa el estado operativo de tus academias clientes, cuotas de alumnos y
            facturación electrónica SUNAT en un entorno claro y descansado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewClientModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Nueva Academia
          </button>
        </div>
      </div>

      {/* 2. Executive Metrics - 4 Spacious, Reassuring Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Academias Totales
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalClients}</div>
          <p className="text-xs text-slate-500">Sedes registradas en el Perú</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
              En Prueba (14 Días)
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-700">{trialClients}</div>
          <p className="text-xs text-slate-500">Disfrutando funciones Pro</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Ingreso Mensual (MRR)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-700">S/ {totalMrr.toFixed(2)}</div>
          <p className="text-xs text-slate-500">{proClients + enterpriseClients} academias en planes de pago</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Alumnos Registrados
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalStudents.toLocaleString()}</div>
          <p className="text-xs text-slate-500">Practicando en todas las sedes</p>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por academia, RUC, ciudad o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({clients.length})
          </button>
          <button
            onClick={() => setFilterStatus('TRIAL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              filterStatus === 'TRIAL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            En Prueba ({trialClients})
          </button>
          <button
            onClick={() => setFilterStatus('PRO')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              filterStatus === 'PRO'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Plan Pro ({proClients})
          </button>
          <button
            onClick={() => setFilterStatus('FREE')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              filterStatus === 'FREE'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Plan Free ({freeClients})
          </button>
          <button
            onClick={() => setFilterStatus('OVER_LIMIT')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              filterStatus === 'OVER_LIMIT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cerca del Límite
          </button>
        </div>
      </div>

      {/* 4. Clients Directory Cards */}
      <div className="space-y-4">
        {filteredClients.map((client) => {
          const isTrial = client.planStatus === 'TRIALING';
          const isPro = client.plan === 'PRO';
          const isEnterprise = client.plan === 'ENTERPRISE';
          const isFree = client.plan === 'FREE';
          const isSuspended = client.isSuspended;

          const usagePercent = client.studentsLimit
            ? Math.min(100, (client.studentsCount / client.studentsLimit) * 100)
            : 0;

          return (
            <div
              key={client.id}
              className={`bg-white border rounded-2xl p-6 transition shadow-xs hover:shadow-md ${
                isSuspended
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-6">
                {/* Academy Basic Details */}
                <div className="space-y-3 flex-1 min-w-[300px]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      {client.name}
                    </h3>
                    <span className="text-xs text-slate-500 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-medium">
                      RUC: {client.ruc}
                    </span>

                    {/* Plan Badge */}
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                        isSuspended
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isTrial
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : isEnterprise
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : isPro
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isSuspended
                        ? 'Cuenta Suspendida'
                        : isTrial
                        ? `Plan PRO (Prueba: ${client.trialDaysLeft} días)`
                        : isEnterprise
                        ? 'Plan Enterprise (S/ 249/mes)'
                        : isPro
                        ? 'Plan PRO (S/ 99/mes)'
                        : 'Plan Gratuito'}
                    </span>

                    {/* SUNAT Badge */}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                        client.sunatStatus === 'CONFIGURED_PROD'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : client.sunatStatus === 'CONFIGURED_BETA'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {client.sunatStatus === 'CONFIGURED_PROD'
                        ? '● SUNAT Producción'
                        : client.sunatStatus === 'CONFIGURED_BETA'
                        ? '● SUNAT Modo Pruebas'
                        : '○ SUNAT Pendiente'}
                    </span>
                  </div>

                  <div className="text-slate-600 text-sm flex items-center gap-4 flex-wrap">
                    <span>
                      <strong className="text-slate-700">Razón Social:</strong> {client.legalName}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-700">Sede:</strong> {client.city}, {client.department}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-700">Contacto:</strong> {client.contactPerson} ({client.phone})
                    </span>
                  </div>

                  {/* Tenant ID & API Key snippet */}
                  <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-500">ID:</span>
                      <code className="text-slate-700 font-mono text-xs">{client.id}</code>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-500">API Key:</span>
                      <code className="text-slate-700 font-mono text-xs">
                        {client.apiKey.substring(0, 12)}••••••••
                      </code>
                      <button
                        onClick={() => handleCopyApiKey(client.id, client.apiKey)}
                        className="p-1 hover:text-emerald-700 text-slate-400 transition cursor-pointer"
                        title="Copiar Llave API"
                      >
                        {copiedKeyId === client.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <span className="text-slate-400 text-xs ml-auto">
                      Última actividad: {client.lastActiveAt}
                    </span>
                  </div>
                </div>

                {/* Resource Stats & Capacity Indicators */}
                <div className="flex items-center gap-6 sm:border-l sm:border-slate-200 sm:pl-6 w-full lg:w-auto justify-between lg:justify-start">
                  {/* Students Counter & Limit */}
                  <div className="w-36 space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-medium">Capacidad</span>
                      <span className="text-sm font-bold text-slate-900">
                        {client.studentsCount}
                        <span className="text-slate-400 font-normal">
                          {client.studentsLimit ? ` / ${client.studentsLimit}` : ' (Ilim.)'}
                        </span>
                      </span>
                    </div>

                    {client.studentsLimit ? (
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            usagePercent >= 90 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-700 font-medium">Alumnos Ilimitados</div>
                    )}
                  </div>

                  {/* Facturación y Staff */}
                  <div className="text-right space-y-1 hidden sm:block">
                    <div className="text-slate-500 text-xs">
                      Comprobantes: <strong className="text-slate-800">{client.invoicesThisMonth}</strong>
                    </div>
                    <div className="text-slate-500 text-xs">
                      Profesores: <strong className="text-slate-800">{client.staffCount}</strong>
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition font-semibold cursor-pointer shadow-xs"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>Gestionar</span>
                    </button>

                    <button
                      onClick={() => onSelectClientForApiTesting(client.id)}
                      className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition font-semibold cursor-pointer"
                      title="Abrir este tenant en la consola de API"
                    >
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span>Probar API</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-500 shadow-xs">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-700">No se encontraron academias</p>
            <p className="text-sm text-slate-400 mt-1">Prueba con otro término de búsqueda o limpia los filtros.</p>
          </div>
        )}
      </div>

      {/* 5. Detailed Client Management Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-700">
            {/* Modal Header */}
            <div className="border-b border-slate-200 p-6 flex items-start justify-between bg-slate-50/70 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {selectedClient.name}
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      selectedClient.isSuspended
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : selectedClient.planStatus === 'TRIALING'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {selectedClient.isSuspended
                      ? 'Suspendido'
                      : selectedClient.planStatus === 'TRIALING'
                      ? `Prueba (${selectedClient.trialDaysLeft}d)`
                      : selectedClient.plan}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  RUC: {selectedClient.ruc} • {selectedClient.legalName} • ID: {selectedClient.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Plan & Subscription Controls */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Plan y Suscripción de la Academia
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Plan Free */}
                  <div
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedClient.plan === 'FREE'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    onClick={() => handleChangePlan(selectedClient, 'FREE')}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">Plan Gratuito</span>
                      {selectedClient.plan === 'FREE' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-base font-bold text-slate-900">S/ 0.00</div>
                    <span className="text-xs text-slate-500 block mt-1">
                      Hasta 30 alumnos • Sin SUNAT
                    </span>
                  </div>

                  {/* Plan Pro */}
                  <div
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedClient.plan === 'PRO'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    onClick={() => handleChangePlan(selectedClient, 'PRO')}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">Plan PRO</span>
                      {selectedClient.plan === 'PRO' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-base font-bold text-emerald-700">S/ 99.00 / mes</div>
                    <span className="text-xs text-slate-500 block mt-1">
                      Alumnos ilimitados • Facturación SUNAT
                    </span>
                  </div>

                  {/* Plan Enterprise */}
                  <div
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedClient.plan === 'ENTERPRISE'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    onClick={() => handleChangePlan(selectedClient, 'ENTERPRISE')}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">Plan ENTERPRISE</span>
                      {selectedClient.plan === 'ENTERPRISE' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="text-base font-bold text-slate-900">S/ 249.00 / mes</div>
                    <span className="text-xs text-slate-500 block mt-1">
                      Multi-sede total • Soporte Prioritario
                    </span>
                  </div>
                </div>

                {/* Trial Extension and Suspension Actions */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Extender días de prueba:</span>
                    <button
                      onClick={() => handleExtendTrial(selectedClient, 7)}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition font-medium cursor-pointer"
                    >
                      +7 Días
                    </button>
                    <button
                      onClick={() => handleExtendTrial(selectedClient, 14)}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition font-semibold cursor-pointer"
                    >
                      +14 Días
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleSuspension(selectedClient)}
                    className={`px-4 py-2 rounded-xl border transition font-semibold flex items-center gap-2 cursor-pointer ${
                      selectedClient.isSuspended
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {selectedClient.isSuspended ? (
                      <>
                        <PlayCircle className="w-4 h-4" /> Reactivar Cuenta
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-4 h-4" /> Suspender Temporalmente
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* API Access & Tenant Keys */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-600" /> Credenciales y Llaves de Acceso
                </h4>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase block mb-1">
                      Identificador de Sede (x-academy-id)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={selectedClient.id}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-mono text-sm w-full"
                      />
                      <button
                        onClick={() => handleCopyApiKey('tenant-id', selectedClient.id)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                        title="Copiar ID"
                      >
                        {copiedKeyId === 'tenant-id' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-500 text-xs font-semibold uppercase">API Secret Key</span>
                      <button
                        onClick={() => handleRegenerateApiKey(selectedClient)}
                        className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Regenerar Llave
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={selectedClient.apiKey}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-mono text-sm w-full"
                      />
                      <button
                        onClick={() => handleCopyApiKey('api-key', selectedClient.apiKey)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                        title="Copiar API Key"
                      >
                        {copiedKeyId === 'api-key' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fiscal & Contact Data */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-3 text-sm">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" /> Datos de Contacto y SUNAT
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-slate-400 text-xs font-medium block">Dirección Legal</span>
                    <span className="text-slate-800 font-medium">{selectedClient.address}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-medium block">Email de Facturación</span>
                    <span className="text-slate-800 font-medium">{selectedClient.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-medium block">Teléfono / WhatsApp</span>
                    <span className="text-slate-800 font-medium">{selectedClient.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-medium block">Certificado Digital SUNAT</span>
                    <span className="text-emerald-700 font-medium">
                      {selectedClient.certificateExpiresAt
                        ? `Válido hasta ${selectedClient.certificateExpiresAt}`
                        : 'No registrado aún'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/80 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => {
                  onSelectClientForApiTesting(selectedClient.id);
                  setSelectedClient(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold flex items-center gap-2 transition cursor-pointer text-sm"
              >
                <Zap className="w-4 h-4 text-amber-600" /> Probar en Consola API
              </button>

              <button
                onClick={() => setSelectedClient(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition cursor-pointer text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. New Client Onboarding Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-700">
            <div className="border-b border-slate-200 p-6 flex items-start justify-between bg-slate-50/80 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" /> Alta de Nueva Academia
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Registra una nueva academia deportiva con 14 días de prueba Pro sin costo alguno.
                </p>
              </div>

              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClient} className="p-6 sm:p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-1.5">
                    Nombre de la Academia *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Academia Los Leones FC"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-1.5">
                    RUC (11 Dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="20XXXXXXXXX"
                    value={newForm.ruc}
                    onChange={(e) => setNewForm({ ...newForm, ruc: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 text-sm font-semibold mb-1.5">
                    Razón Social Tributaria *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ASOCIACIÓN CLUB DEPORTIVO LOS LEONES"
                    value={newForm.legalName}
                    onChange={(e) => setNewForm({ ...newForm, legalName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-1.5">
                    Nombre del Encargado o Director *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={newForm.contactPerson}
                    onChange={(e) => setNewForm({ ...newForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-1.5">
                    Email de Contacto *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="director@losleones.pe"
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-1.5">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+51 987 654 321"
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-1.5">
                    Ciudad / Sede
                  </label>
                  <input
                    type="text"
                    placeholder="Lima / Arequipa / Trujillo..."
                    value={newForm.city}
                    onChange={(e) => setNewForm({ ...newForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Automatic Trial notice */}
              <div className="p-4 bg-purple-50 border border-purple-200/80 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-purple-900">
                <Clock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Activación Automática:</strong> La academia iniciará con el{' '}
                  <span className="font-bold">Plan PRO con 14 días de prueba gratuita</span>. Al terminar el período,
                  pasará al plan Free sin perder ningún dato de sus alumnos.
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition cursor-pointer text-sm"
                >
                  Registrar Academia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
