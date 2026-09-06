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
  onAddClient: (newClient: SaaSClientAcademy) => Promise<any> | void;
  onSelectClientForApiTesting?: (academyId: string) => void;
  onEnterAcademyPortal?: (academyId: string) => void;
}

export const SaaSClientAdmin: React.FC<SaaSClientAdminProps> = ({
  clients,
  onUpdateClient,
  onAddClient,
  onSelectClientForApiTesting,
  onEnterAcademyPortal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'TRIAL' | 'PRO' | 'FREE' | 'ENTERPRISE' | 'OVER_LIMIT'>('ALL');
  const [selectedClient, setSelectedClient] = useState<SaaSClientAcademy | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const totalStudents = clients.reduce((acc, c) => acc + (c.studentsCount || 0), 0);
  const totalInvoices = clients.reduce((acc, c) => acc + (c.invoicesThisMonth || 0), 0);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const q = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.legalName || '').toLowerCase().includes(q) ||
      (c.ruc || '').includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.contactPerson || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterStatus === 'TRIAL') return c.planStatus === 'TRIALING';
    if (filterStatus === 'PRO') return c.plan === 'PRO';
    if (filterStatus === 'FREE') return c.plan === 'FREE';
    if (filterStatus === 'ENTERPRISE') return c.plan === 'ENTERPRISE';
    if (filterStatus === 'OVER_LIMIT') {
      return c.studentsLimit !== null && (c.studentsCount || 0) >= (c.studentsLimit || 0) * 0.9;
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

  const handleCreateNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name || !newForm.ruc || newForm.ruc.length !== 11) {
      alert('Por favor ingresa un nombre válido y un RUC de 11 dígitos.');
      return;
    }

    setIsSubmitting(true);
    try {
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

      await onAddClient(newClient);
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
    } catch (err: any) {
      alert(`Error al registrar academia en la base de datos: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* 1. Header & Architecture Link Alert */}
      <div className="bg-[#111622] border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-wrap items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Building2 className="w-6 h-6" />
            </span>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Panel de Administración de Mis Clientes (SaaS SuperAdmin)
            </h2>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              Multi-Tenant Engine
            </span>
          </div>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            Gestión centralizada de academias deportivas clientes: estado de suscripción, cuotas de alumnos,
            facturación recurrente MRR, credenciales SUNAT UBL 2.1 y llaves de acceso API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewClientModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition cursor-pointer text-sm"
          >
            <Plus className="w-5 h-5" /> Registrar Nueva Academia
          </button>
        </div>
      </div>

      {/* 2. Executive SaaS Metrics (MRR, Tenants, Trials, Alumnos) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#111622] border border-slate-800/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-sky-400" /> Clientes Totales
          </span>
          <div className="text-2xl font-bold text-white">{totalClients}</div>
          <span className="text-xs text-slate-400 block">Academias en Perú</span>
        </div>

        <div className="bg-[#111622] border border-slate-800/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs text-purple-400 uppercase font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-400" /> En Prueba (14d)
          </span>
          <div className="text-2xl font-bold text-purple-300">{trialClients}</div>
          <span className="text-xs text-slate-400 block">Prueba Pro gratuita</span>
        </div>

        <div className="bg-[#111622] border border-slate-800/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs text-amber-400 uppercase font-semibold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" /> Clientes Pro
          </span>
          <div className="text-2xl font-bold text-amber-300">{proClients + enterpriseClients}</div>
          <span className="text-xs text-slate-400 block">S/ 99 - S/ 249/mes</span>
        </div>

        <div className="bg-[#111622] border border-slate-800/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-slate-400" /> Plan Free
          </span>
          <div className="text-2xl font-bold text-slate-200">{freeClients}</div>
          <span className="text-xs text-slate-400 block">Hasta 30 alumnos</span>
        </div>

        <div className="bg-[#111622] border border-slate-800/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" /> MRR Proyectado
          </span>
          <div className="text-2xl font-bold text-emerald-300">S/ {totalMrr.toFixed(2)}</div>
          <span className="text-xs text-slate-400 block">Ingreso recurrente</span>
        </div>

        <div className="bg-[#111622] border border-slate-800/80 rounded-2xl p-5 space-y-2">
          <span className="text-xs text-sky-400 uppercase font-semibold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-sky-400" /> Alumnos Red
          </span>
          <div className="text-2xl font-bold text-white">{totalStudents.toLocaleString()}</div>
          <span className="text-xs text-slate-400 block">En todas las sedes</span>
        </div>
      </div>

      {/* 3. Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111622] border border-slate-800/80 rounded-2xl p-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por academia, RUC, ciudad o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B0E14] border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${filterStatus === 'ALL'
              ? 'bg-sky-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setFilterStatus('TRIAL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${filterStatus === 'TRIAL'
              ? 'bg-purple-500 text-white font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
          >
            En Prueba 14d ({trialClients})
          </button>
          <button
            onClick={() => setFilterStatus('PRO')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${filterStatus === 'PRO'
              ? 'bg-amber-400 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
          >
            Plan PRO ({proClients})
          </button>
          <button
            onClick={() => setFilterStatus('FREE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${filterStatus === 'FREE'
              ? 'bg-slate-700 text-white font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
          >
            Plan FREE ({freeClients})
          </button>
          <button
            onClick={() => setFilterStatus('OVER_LIMIT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${filterStatus === 'OVER_LIMIT'
              ? 'bg-rose-500 text-white font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
          >
            Límite Alumnos
          </button>
        </div>
      </div>

      {/* 4. Clients Directory Grid / Table */}
      <div className="space-y-4">
        {filteredClients.map((client) => {
          const isTrial = client.planStatus === 'TRIALING';
          const isPro = client.plan === 'PRO';
          const isEnterprise = client.plan === 'ENTERPRISE';
          const isFree = client.plan === 'FREE';
          const isSuspended = client.isSuspended;

          // Resource usage percent
          const usagePercent = client.studentsLimit
            ? Math.min(100, (client.studentsCount / client.studentsLimit) * 100)
            : 0;

          return (
            <div
              key={client.id}
              className={`bg-[#111622] border rounded-3xl p-6 transition shadow-xl ${isSuspended
                ? 'border-rose-900/60 opacity-60 bg-rose-950/10'
                : isTrial
                  ? 'border-purple-500/30 hover:border-purple-500/50'
                  : isEnterprise
                    ? 'border-amber-500/40 hover:border-amber-500/60'
                    : isPro
                      ? 'border-sky-500/30 hover:border-sky-500/50'
                      : 'border-slate-800 hover:border-slate-700'
                }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-6">
                {/* Academy Basic Details */}
                <div className="space-y-2 flex-1 min-w-[300px]">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-white tracking-tight">{client.name}</h3>
                    <span className="text-xs text-slate-400 px-2.5 py-0.5 rounded-lg bg-[#0B0E14] border border-slate-800 font-mono">
                      RUC: {client.ruc}
                    </span>

                    {/* Plan Badge */}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${isSuspended
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : isTrial
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : isEnterprise
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : isPro
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-slate-700/40 text-slate-300 border-slate-600'
                        }`}
                    >
                      {isSuspended
                        ? 'SUSPENDIDO'
                        : isTrial
                          ? `PRO (Prueba ${client.trialDaysLeft}d)`
                          : isEnterprise
                            ? 'ENTERPRISE (S/ 249/m)'
                            : isPro
                              ? 'PRO (S/ 99/m)'
                              : 'FREE (S/ 0/m)'}
                    </span>

                    {/* SUNAT Badge */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${client.sunatStatus === 'CONFIGURED_PROD'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : client.sunatStatus === 'CONFIGURED_BETA'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                    >
                      {client.sunatStatus === 'CONFIGURED_PROD'
                        ? 'SUNAT Prod (UBL 2.1)'
                        : client.sunatStatus === 'CONFIGURED_BETA'
                          ? 'SUNAT Beta'
                          : 'SOL Pendiente'}
                    </span>
                  </div>

                  <div className="text-slate-400 text-sm flex items-center gap-3 flex-wrap leading-relaxed">
                    <span>
                      <strong className="text-slate-300">Razón Social:</strong> {client.legalName}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-300">Sede:</strong> {client.city}, {client.department}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-300">Contacto:</strong> {client.contactPerson} ({client.phone})
                    </span>
                  </div>

                  {/* Tenant ID & API Key snippet */}
                  <div className="flex items-center gap-3 pt-1 text-xs text-slate-400 flex-wrap">
                    <span className="text-slate-500 uppercase text-xs font-semibold">Tenant ID:</span>
                    <code className="bg-[#0B0E14] text-amber-300 px-2 py-1 rounded-lg border border-slate-800 font-mono">
                      {client.id}
                    </code>

                    <span className="text-slate-500 uppercase text-xs font-semibold ml-2">API Key:</span>
                    <div className="flex items-center gap-1.5 bg-[#0B0E14] px-2 py-1 rounded-lg border border-slate-800">
                      <Key className="w-3.5 h-3.5 text-sky-400" />
                      <code className="text-slate-300 font-mono text-xs">
                        {client.apiKey.substring(0, 14)}••••••••
                      </code>
                      <button
                        onClick={() => handleCopyApiKey(client.id, client.apiKey)}
                        className="p-1 hover:text-white text-slate-400 transition cursor-pointer"
                        title="Copiar API Key"
                      >
                        {copiedKeyId === client.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <span className="text-slate-500 text-xs ml-auto">
                      Actividad: {client.lastActiveAt}
                    </span>
                  </div>
                </div>

                {/* Resource Stats & Capacity Indicators */}
                <div className="flex items-center gap-6 border-l border-slate-800 pl-6">
                  {/* Students Counter & Limit */}
                  <div className="w-36">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Alumnos</span>
                      <span className="text-sm font-bold text-white">
                        {client.studentsCount}
                        <span className="text-slate-400 font-normal text-xs">
                          {client.studentsLimit ? ` / ${client.studentsLimit}` : ' (Ilim.)'}
                        </span>
                      </span>
                    </div>

                    {client.studentsLimit ? (
                      <div className="w-full bg-[#0B0E14] h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-rose-500' : 'bg-sky-400'
                            }`}
                          style={{ width: `${usagePercent}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-400 font-semibold">Sin límite de alumnos</div>
                    )}
                  </div>

                  {/* Facturación y Staff */}
                  <div className="text-right space-y-1">
                    <div className="text-slate-400 text-xs">
                      Comprobantes mes: <strong className="text-white">{client.invoicesThisMonth}</strong>
                    </div>
                    <div className="text-slate-400 text-xs">
                      Staff / Coaches: <strong className="text-white">{client.staffCount}</strong>
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="px-4 py-2 bg-[#0B0E14] hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 rounded-xl text-xs flex items-center gap-2 transition font-semibold cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-sky-400" />
                      <span>Gestionar</span>
                    </button>

                    {onEnterAcademyPortal && (
                      <button
                        onClick={() => onEnterAcademyPortal(client.id)}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs flex items-center gap-2 transition font-semibold cursor-pointer"
                        title="Ingresar al portal operativo de esta academia como Super Admin"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Abrir Sede</span>
                      </button>
                    )}

                    {onSelectClientForApiTesting && (
                      <button
                        onClick={() => onSelectClientForApiTesting(client.id)}
                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs flex items-center gap-2 transition font-semibold cursor-pointer"
                        title="Abrir este tenant en la consola de API"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Probar API</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="p-12 text-center bg-[#111622] border border-slate-800 rounded-3xl text-slate-400 text-sm">
            No se encontraron academias clientes con el filtro o búsqueda actual.
          </div>
        )}
      </div>

      {/* 5. Detailed Client Management Drawer/Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0E14] border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200">
            {/* Modal Header */}
            <div className="border-b border-slate-800 p-6 flex items-start justify-between bg-[#111622]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {selectedClient.name}
                  </h3>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${selectedClient.isSuspended
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : selectedClient.planStatus === 'TRIALING'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                  >
                    {selectedClient.isSuspended
                      ? 'SUSPENDIDO'
                      : selectedClient.planStatus === 'TRIALING'
                        ? `Prueba (${selectedClient.trialDaysLeft}d)`
                        : selectedClient.plan}
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-mono mt-1.5">
                  RUC: {selectedClient.ruc} • {selectedClient.legalName} • ID: {selectedClient.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Plan & Subscription Controls */}
              <div className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2 tracking-wider">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Plan SaaS y Suscripción del Cliente
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Plan Free Button */}
                  <div
                    className={`p-4 rounded-2xl border cursor-pointer transition ${selectedClient.plan === 'FREE'
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-800 bg-[#0B0E14] hover:border-slate-700'
                      }`}
                    onClick={() => handleChangePlan(selectedClient, 'FREE')}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-sm">Plan FREE</span>
                      {selectedClient.plan === 'FREE' && (
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      )}
                    </div>
                    <div className="text-base font-black text-white">S/ 0.00</div>
                    <span className="text-xs text-slate-400 block mt-1 leading-relaxed">
                      Hasta 30 alumnos • Sin SUNAT
                    </span>
                  </div>

                  {/* Plan Pro Button */}
                  <div
                    className={`p-4 rounded-2xl border cursor-pointer transition ${selectedClient.plan === 'PRO'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-800 bg-[#0B0E14] hover:border-slate-700'
                      }`}
                    onClick={() => handleChangePlan(selectedClient, 'PRO')}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-amber-300 text-sm">Plan PRO</span>
                      {selectedClient.plan === 'PRO' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="text-base font-black text-white">S/ 99.00/mes</div>
                    <span className="text-xs text-slate-400 block mt-1 leading-relaxed">
                      Alumnos ilimitados • Facturación SUNAT
                    </span>
                  </div>

                  {/* Plan Enterprise Button */}
                  <div
                    className={`p-4 rounded-2xl border cursor-pointer transition ${selectedClient.plan === 'ENTERPRISE'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 bg-[#0B0E14] hover:border-slate-700'
                      }`}
                    onClick={() => handleChangePlan(selectedClient, 'ENTERPRISE')}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-emerald-300 text-sm">Plan ENTERPRISE</span>
                      {selectedClient.plan === 'ENTERPRISE' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="text-base font-black text-white">S/ 249.00/mes</div>
                    <span className="text-xs text-slate-400 block mt-1 leading-relaxed">
                      Multisede total • SLA Prioritario
                    </span>
                  </div>
                </div>

                {/* Trial Extension and Suspension Actions */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-400 text-xs md:text-sm">Extender período de prueba PRO:</span>
                    <button
                      onClick={() => handleExtendTrial(selectedClient, 7)}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl transition text-xs font-semibold cursor-pointer"
                    >
                      +7 Días
                    </button>
                    <button
                      onClick={() => handleExtendTrial(selectedClient, 14)}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl transition text-xs font-bold cursor-pointer"
                    >
                      +14 Días
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleSuspension(selectedClient)}
                    className={`px-4 py-2 rounded-xl border transition font-bold flex items-center gap-2 text-xs cursor-pointer ${selectedClient.isSuspended
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                  >
                    {selectedClient.isSuspended ? (
                      <>
                        <PlayCircle className="w-4 h-4" /> Reactivar Cuenta
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-4 h-4" /> Suspender Cuenta
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* API Access & Tenant Keys */}
              <div className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2 tracking-wider">
                  <Key className="w-4 h-4 text-sky-400" /> Credenciales API & Integración
                </h4>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs uppercase block mb-1.5 font-semibold">
                      Encabezado Multi-Tenant (x-academy-id)
                    </span>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="text"
                        readOnly
                        value={selectedClient.id}
                        className="bg-[#0B0E14] border border-slate-700 rounded-xl px-4 py-2.5 text-amber-300 font-mono text-sm w-full"
                      />
                      <button
                        onClick={() => handleCopyApiKey('tenant-id', selectedClient.id)}
                        className="p-2.5 bg-[#0B0E14] border border-slate-700 rounded-xl hover:bg-slate-800 transition cursor-pointer text-slate-300"
                      >
                        {copiedKeyId === 'tenant-id' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-400 text-xs uppercase font-semibold">API Secret Key</span>
                      <button
                        onClick={() => handleRegenerateApiKey(selectedClient)}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerar Llave
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="text"
                        readOnly
                        value={selectedClient.apiKey}
                        className="bg-[#0B0E14] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm w-full"
                      />
                      <button
                        onClick={() => handleCopyApiKey('api-key', selectedClient.apiKey)}
                        className="p-2.5 bg-[#0B0E14] border border-slate-700 rounded-xl hover:bg-slate-800 transition cursor-pointer text-slate-300"
                      >
                        {copiedKeyId === 'api-key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fiscal & Contact Data */}
              <div className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-3 text-sm">
                <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2 tracking-wider">
                  <Shield className="w-4 h-4 text-emerald-400" /> Datos Fiscales y Certificado Digital
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-slate-500 text-xs uppercase block font-semibold">Dirección Legal:</span>
                    <span className="text-white mt-0.5 block">{selectedClient.address}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase block font-semibold">Email de Facturación:</span>
                    <span className="text-white mt-0.5 block">{selectedClient.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase block font-semibold">Teléfono / WhatsApp:</span>
                    <span className="text-white mt-0.5 block">{selectedClient.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase block font-semibold">Certificado Digital SUNAT:</span>
                    <span className="text-emerald-400 mt-0.5 block font-medium">
                      {selectedClient.certificateExpiresAt
                        ? `Válido hasta ${selectedClient.certificateExpiresAt}`
                        : 'No registrado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. New Client Onboarding Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0E14] border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200">
            <div className="border-b border-slate-800 p-6 flex items-start justify-between bg-[#111622]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <Plus className="w-5 h-5 text-sky-400" /> Alta de Nueva Academia Cliente (Onboarding)
                </h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  Registra una nueva academia deportiva con 14 días de prueba PRO ilimitada sin tarjeta.
                </p>
              </div>

              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClient} className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-slate-300 text-xs md:text-sm font-semibold mb-1.5">
                    Nombre Comercial de la Academia *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Academia Los Leones FC"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    className="w-full bg-[#111622] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs md:text-sm font-semibold mb-1.5">
                    RUC (11 Dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="20XXXXXXXXX"
                    value={newForm.ruc}
                    onChange={(e) => setNewForm({ ...newForm, ruc: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-[#111622] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 text-xs md:text-sm font-semibold mb-1.5">
                    Razón Social Tributaria *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ASOCIACIÓN CLUB DEPORTIVO LOS LEONES"
                    value={newForm.legalName}
                    onChange={(e) => setNewForm({ ...newForm, legalName: e.target.value })}
                    className="w-full bg-[#111622] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs md:text-sm font-semibold mb-1.5">
                    Nombre del Director / Dueño *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={newForm.contactPerson}
                    onChange={(e) => setNewForm({ ...newForm, contactPerson: e.target.value })}
                    className="w-full bg-[#111622] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs md:text-sm font-semibold mb-1.5">
                    Email de Contacto *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="director@losleones.pe"
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    className="w-full bg-[#111622] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs md:text-sm font-semibold mb-1.5">
                    Teléfono / Celular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+51 987 654 321"
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    className="w-full bg-[#111622] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs md:text-sm font-semibold mb-1.5">
                    Ciudad / Sede
                  </label>
                  <input
                    type="text"
                    placeholder="Lima / Arequipa / Trujillo..."
                    value={newForm.city}
                    onChange={(e) => setNewForm({ ...newForm, city: e.target.value })}
                    className="w-full bg-[#111622] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Automatic Trial notice */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-start gap-3 text-xs md:text-sm text-purple-200 leading-relaxed">
                <Clock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Activación Instantánea:</strong> La academia iniciará con el{' '}
                  <span className="text-white font-bold">Plan PRO con 14 días de prueba gratuita</span> (sin tarjeta de
                  crédito). Al culminar los 14 días, el sistema degradará de manera segura al plan Free (máx 30 alumnos)
                  sin eliminar ninguna data.
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-50 text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/20 transition disabled:opacity-60 flex items-center gap-2 text-sm cursor-pointer"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />}
                  {isSubmitting ? 'Guardando en Base de Datos...' : 'Crear Academia Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SaaSClientAdmin;
