import React, { useState } from 'react';
import {
  Building2,
  Trophy,
  Users,
  CreditCard,
  ShieldCheck,
  Zap,
  Plus,
  Edit2,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  Lock,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  FileCheck,
  Calendar,
  DollarSign,
  Briefcase,
  Shield,
  Activity,
  Save,
  Info,
} from 'lucide-react';
import {
  WebAcademyProfile,
  WebSportItem,
  WebStaffMember,
  WebFeeTariff,
  SubscriptionStatusInfo,
} from '../types';
import { WebSunatCertUploader } from './WebSunatCertUploader';
import { triggerTopLoading } from './TopLoadingBar';

interface WebAdminPanelProps {
  academyProfile: WebAcademyProfile;
  sports: WebSportItem[];
  staff: WebStaffMember[];
  tariffs: WebFeeTariff[];
  subscription?: SubscriptionStatusInfo;
  onUpdateProfile: (updated: WebAcademyProfile) => void;
  onAddSport: (sport: WebSportItem) => void;
  onToggleSportStatus: (sportId: string) => void;
  onAddStaff: (member: WebStaffMember) => void;
  onRemoveStaff?: (staffId: string) => void;
  onAddTariff: (tariff: WebFeeTariff) => void;
  onOpenPlansModal?: () => void;
}

type AdminSubTab = 'profile' | 'sports' | 'staff' | 'tariffs' | 'sunat' | 'saas';

export const WebAdminPanel: React.FC<WebAdminPanelProps> = ({
  academyProfile,
  sports,
  staff,
  tariffs,
  subscription,
  onUpdateProfile,
  onAddSport,
  onToggleSportStatus,
  onAddStaff,
  onRemoveStaff,
  onAddTariff,
  onOpenPlansModal,
}) => {
  const [activeTab, setActiveTab] = useState<AdminSubTab>('profile');

  // Edit Profile Local State
  const [profileForm, setProfileForm] = useState<WebAcademyProfile>({ ...academyProfile });
  const [isSaved, setIsSaved] = useState(false);

  // New Sport Modal
  const [showSportModal, setShowSportModal] = useState(false);
  const [newSportName, setNewSportName] = useState('');
  const [newSportDesc, setNewSportDesc] = useState('');
  const [newSportCategories, setNewSportCategories] = useState('Sub-8, Sub-10, Sub-12, Sub-14');
  const [newSportCourts, setNewSportCourts] = useState('Cancha 1');
  const [newSportFee, setNewSportFee] = useState('180');

  // New Staff Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffDni, setNewStaffDni] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'OWNER' | 'ADMIN' | 'COACH' | 'CASHIER' | 'STAFF'>('COACH');
  const [newStaffRoleTitle, setNewStaffRoleTitle] = useState('Entrenador Asistente');
  const [newStaffSport, setNewStaffSport] = useState('Fútbol Formativo');
  const [newStaffSalary, setNewStaffSalary] = useState('2200');

  // New Tariff Modal
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [newTariffName, setNewTariffName] = useState('');
  const [newTariffSport, setNewTariffSport] = useState('Fútbol Formativo');
  const [newTariffType, setNewTariffType] = useState<'MONTHLY' | 'ENROLLMENT' | 'UNIFORM' | 'TRIAL'>('MONTHLY');
  const [newTariffAmount, setNewTariffAmount] = useState('180');
  const [newTariffDueDay, setNewTariffDueDay] = useState('5');
  const [newTariffDiscount, setNewTariffDiscount] = useState('10');
  const [newTariffDesc, setNewTariffDesc] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleCreateSport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSportName.trim()) return;
    const sport: WebSportItem = {
      id: `sport-${Date.now()}`,
      name: newSportName.trim(),
      iconName: 'Trophy',
      description: newSportDesc.trim() || 'Disciplina deportiva formativa.',
      categories: newSportCategories.split(',').map((c) => c.trim()).filter(Boolean),
      assignedCourts: newSportCourts.split(',').map((c) => c.trim()).filter(Boolean),
      monthlyFee: parseFloat(newSportFee) || 180,
      activeStudents: 0,
      isActive: true,
    };
    onAddSport(sport);
    setNewSportName('');
    setNewSportDesc('');
    setShowSportModal(false);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffDni.trim()) return;
    const member: WebStaffMember = {
      id: `stf-${Date.now()}`,
      name: newStaffName.trim(),
      dni: newStaffDni.trim(),
      email: newStaffEmail.trim() || `${newStaffDni}@academia.pe`,
      phone: newStaffPhone.trim() || '+51 900 000 000',
      role: newStaffRole,
      roleTitle: newStaffRoleTitle.trim(),
      sports: newStaffRole === 'COACH' ? [newStaffSport] : [],
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      monthlySalary: parseFloat(newStaffSalary) || 2000,
    };
    onAddStaff(member);
    setNewStaffName('');
    setNewStaffDni('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setShowStaffModal(false);
  };

  const handleCreateTariff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTariffName.trim()) return;
    const tariff: WebFeeTariff = {
      id: `trf-${Date.now()}`,
      name: newTariffName.trim(),
      sport: newTariffSport,
      type: newTariffType,
      amount: parseFloat(newTariffAmount) || 180,
      frequency: newTariffType === 'MONTHLY' ? 'MONTHLY' : 'ONE_TIME',
      dueDay: parseInt(newTariffDueDay, 10) || 5,
      earlyBirdDiscount: parseFloat(newTariffDiscount) || 0,
      description: newTariffDesc.trim() || 'Tarifa oficial de la academia.',
      isActive: true,
    };
    onAddTariff(tariff);
    setNewTariffName('');
    setNewTariffDesc('');
    setShowTariffModal(false);
  };

  const isSunatPro = subscription?.features?.SUNAT_BILLING ?? true;

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Header Context Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-amber-50 text-amber-700 text-xs px-3 py-1 rounded-full border border-amber-200 font-semibold uppercase tracking-wide">
              Administración de Sede
            </span>
            <span className="text-slate-800 font-semibold text-sm">{profileForm.name}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-xs font-mono">RUC {profileForm.ruc}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-2.5 tracking-tight">
            Configuración y Gestión de Sede
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Administra los datos fiscales de tu sede deportiva, las disciplinas activas, el equipo de profesores, tarifas oficiales y la vinculación con SUNAT.
          </p>
        </div>

        {/* Quick SaaS Plan Status Chip */}
        {subscription && (
          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <button
              onClick={onOpenPlansModal}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border flex items-center gap-2 transition cursor-pointer shadow-xs ${
                subscription.status === 'TRIALING'
                  ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                  : subscription.plan.code === 'PRO'
                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Plan {subscription.plan.name}</span>
              {subscription.status === 'TRIALING' && (
                <span className="bg-purple-200/70 text-purple-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
                  {subscription.trial.remainingDays}d de prueba
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-slate-100/90 border border-slate-200/80 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto text-xs md:text-sm shadow-xs scrollbar-none">
        {[
          { id: 'profile', label: '1. Sede & Datos Fiscales', icon: Building2 },
          { id: 'sports', label: `2. Deportes (${sports.length})`, icon: Trophy },
          { id: 'staff', label: `3. Personal & Staff (${staff.length})`, icon: Users },
          { id: 'tariffs', label: `4. Tarifas & Precios (${tariffs.length})`, icon: CreditCard },
          { id: 'sunat', label: '5. Configuración SUNAT', icon: ShieldCheck },
          { id: 'saas', label: '6. Límites y Plan', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerTopLoading(250);
                setActiveTab(tab.id as AdminSubTab);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 text-slate-500" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PERFIL & DATOS FISCALES */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-blue-600" />
                Información Institucional y Fiscal de la Sede
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
                Datos de la entidad emisora, dirección física y canales oficiales de atención a padres y alumnos.
              </p>
            </div>
            {isSaved && (
              <span className="bg-emerald-50 text-emerald-700 text-xs md:text-sm px-3.5 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5 font-medium self-start sm:self-auto">
                <Check className="w-4 h-4" /> Cambios Guardados con Éxito
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-2">
                Nombre Comercial de la Sede
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-2">
                Razón Social (Emisor Tributario)
              </label>
              <input
                type="text"
                value={profileForm.legalName}
                onChange={(e) => setProfileForm({ ...profileForm, legalName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-2">
                RUC Oficial (11 dígitos)
              </label>
              <input
                type="text"
                value={profileForm.ruc}
                onChange={(e) => setProfileForm({ ...profileForm, ruc: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-amber-700 font-bold font-mono text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
                maxLength={11}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-2">
                Dirección Física del Complejo o Canchas
              </label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-2">
                Distrito y Departamento
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={profileForm.district}
                  onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
                  placeholder="Distrito"
                />
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
                  placeholder="Departamento"
                />
              </div>
            </div>

            <div>
              <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-2">
                Teléfono de Recepción / Fijo
              </label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-2">
                WhatsApp Oficial para Cobranzas
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileForm.whatsapp}
                  onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-emerald-700 font-semibold text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition pl-10"
                />
                <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-2">
                Correo Electrónico de Contacto
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-2">
                Horarios de Atención y Entrenamiento
              </label>
              <input
                type="text"
                value={profileForm.openingHours}
                onChange={(e) => setProfileForm({ ...profileForm, openingHours: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl text-sm flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" /> Guardar Cambios Institucionales
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: DEPORTES & DISCIPLINAS */}
      {activeTab === 'sports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-500" />
                Catálogo de Deportes y Disciplinas Formativas
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
                Disciplinas impartidas en la sede con sus categorías por edad y áreas de entrenamiento.
              </p>
            </div>
            <button
              onClick={() => setShowSportModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Nueva Disciplina
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sports.map((sp) => (
              <div
                key={sp.id}
                className={`p-6 bg-white border rounded-3xl space-y-4 transition shadow-xs ${
                  sp.isActive ? 'border-slate-200/80 hover:border-slate-300' : 'border-slate-200/50 opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 font-bold">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-slate-900">{sp.name}</h3>
                      <span className="text-xs text-slate-500">{sp.activeStudents} alumnos matriculados</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        sp.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sp.isActive ? 'ACTIVO' : 'PAUSADO'}
                    </span>
                    <button
                      onClick={() => onToggleSportStatus(sp.id)}
                      className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                    >
                      {sp.isActive ? 'Pausar' : 'Activar'}
                    </button>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{sp.description}</p>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs md:text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 font-medium">Categorías:</span>
                    {sp.categories.map((c, i) => (
                      <span key={i} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 font-medium">Canchas:</span>
                    {sp.assignedCourts.map((court, i) => (
                      <span key={i} className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-xs font-medium">
                        {court}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-slate-500 pt-1.5">
                    <span>Pensión sugerida:</span>
                    <span className="text-emerald-600 font-bold text-sm md:text-base">S/ {sp.monthlyFee.toFixed(2)}/mes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF & ENTRENADORES */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <Users className="w-5 h-5 text-blue-600" />
                Equipo Técnico, Entrenadores y Personal Administrativo
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
                Control de roles de acceso al sistema, asignación de disciplinas y canales de contacto directo.
              </p>
            </div>
            <button
              onClick={() => setShowStaffModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Registrar Personal
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Nombre & Cargo</th>
                    <th className="p-4">DNI</th>
                    <th className="p-4">Rol en Sistema</th>
                    <th className="p-4">Disciplinas</th>
                    <th className="p-4">Contacto</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {staff.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{st.roleTitle}</div>
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-xs">{st.dni}</td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                            st.role === 'OWNER'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : st.role === 'COACH'
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : st.role === 'CASHIER'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {st.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {st.sports.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {st.sports.map((sp, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-medium"
                              >
                                {sp}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Administrativo General</span>
                        )}
                      </td>
                      <td className="p-4 text-xs">
                        <div className="text-slate-800 font-medium">{st.phone}</div>
                        <div className="text-slate-500 mt-0.5">{st.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">
                          {st.status === 'ACTIVE' ? 'ACTIVO' : st.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {st.role !== 'OWNER' && onRemoveStaff && (
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Revocar acceso de ${st.name} a esta sede?`)) {
                                onRemoveStaff(st.id);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs text-rose-700 font-medium transition cursor-pointer"
                          >
                            Revocar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TARIFAS & MENSUALIDADES */}
      {activeTab === 'tariffs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Catálogo de Tarifas, Matrículas y Pensiones
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
                Precios oficiales en Soles (PEN) utilizados por el módulo de Caja para emitir cargos y cobranzas.
              </p>
            </div>
            <button
              onClick={() => setShowTariffModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Nueva Tarifa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tariffs.map((trf) => (
              <div key={trf.id} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-3.5 shadow-xs hover:border-slate-300 transition">
                <div className="flex items-start justify-between">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                      trf.type === 'MONTHLY'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : trf.type === 'ENROLLMENT'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {trf.type === 'MONTHLY' ? 'Pensión Mensual' : trf.type === 'ENROLLMENT' ? 'Matrícula' : trf.type}
                  </span>
                  <div className="text-right">
                    <span className="text-xl md:text-2xl font-bold text-emerald-600">
                      S/ {trf.amount.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 block uppercase mt-0.5">{trf.frequency}</span>
                  </div>
                </div>

                <h3 className="text-sm md:text-base font-bold text-slate-900">{trf.name}</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{trf.description}</p>

                <div className="pt-3 border-t border-slate-100 text-xs md:text-sm space-y-1.5 text-slate-500">
                  <div className="flex justify-between">
                    <span>Disciplina:</span>
                    <span className="text-slate-800 font-semibold">{trf.sport}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vencimiento sugerido:</span>
                    <span className="text-slate-800 font-semibold">Día {trf.dueDay} de cada mes</span>
                  </div>
                  {trf.earlyBirdDiscount > 0 && (
                    <div className="flex justify-between text-amber-600 font-medium">
                      <span>Descuento pronto pago:</span>
                      <span>- S/ {trf.earlyBirdDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CONFIGURACIÓN SUNAT SOL & CERTIFICADO DIGITAL */}
      {activeTab === 'sunat' && (
        <div className="space-y-6">
          {/* SaaS Pro Alert regarding SUNAT Billing */}
          <div
            className={`p-5 rounded-3xl border text-xs md:text-sm leading-relaxed ${
              isSunatPro
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-amber-50/80 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {isSunatPro ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="text-sm md:text-base font-bold block mb-1">
                  {isSunatPro
                    ? 'Facturación Electrónica SUNAT Habilitada (Plan PRO Activo)'
                    : 'Aviso del Sistema: Emisión SUNAT Exclusiva del Plan PRO'}
                </strong>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  {isSunatPro
                    ? 'Tu academia cuenta con permisos para emitir Boletas y Facturas electrónicas con firma digital XML-DSig y transmisión directa a los WebServices SOAP de SUNAT.'
                    : 'La emisión y transmisión de nuevas Boletas y Facturas a SUNAT requiere el Plan PRO. En Plan Free tu academia conserva acceso ilimitado a consultar, descargar XML y reimprimir todos los comprobantes emitidos con anterioridad (cero pérdida de datos).'}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Certificate Uploader & SUNAT Configurator */}
          <WebSunatCertUploader
            academyProfile={profileForm}
            onUpdateSunatConfig={(newSunatConfig) => {
              const updated = {
                ...profileForm,
                sunatConfig: newSunatConfig,
              };
              setProfileForm(updated);
              onUpdateProfile(updated);
            }}
          />

          {/* SOAP WebServices Endpoints Reference Box */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 text-xs md:text-sm shadow-xs space-y-3">
            <div className="text-slate-800 font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Endpoints Oficiales de WebServices SOAP de SUNAT (Perú)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-blue-700 font-semibold block mb-1">Ambiente Beta (Pruebas & Homologación):</span>
                <code className="text-slate-700 font-mono text-xs break-all">https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService</code>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-emerald-700 font-semibold block mb-1">Ambiente Producción Oficial (Comprobantes Reales):</span>
                <code className="text-slate-700 font-mono text-xs break-all">https://e-factura.sunat.gob.pe/ol-ti-itcpe/billService</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LÍMITES SAAS & PLAN */}
      {activeTab === 'saas' && subscription && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-500" />
                Estado de la Suscripción SaaS y Cuotas de Uso
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
                Consumo actual de recursos comparado contra los límites contratados en tu plan.
              </p>
            </div>
            <button
              onClick={onOpenPlansModal}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-2xl text-xs md:text-sm flex items-center gap-2 transition cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" /> Cambiar de Plan / Ver Tabla
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Plan Contratado</span>
              <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>{subscription.plan.name}</span>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                  S/ {subscription.plan.priceMonthly.toFixed(2)}/mes
                </span>
              </div>
              <span className="text-xs text-slate-500 block">
                Estado: <strong className="text-emerald-600">{subscription.status}</strong>
              </span>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Alumnos Activos</span>
              <div className="text-xl font-bold text-blue-600">
                {subscription.usage.students} / {subscription.limits.students ?? '∞ Ilimitados'}
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{
                    width: subscription.limits.students
                      ? `${Math.min(100, (subscription.usage.students / subscription.limits.students) * 100)}%`
                      : '35%',
                  }}
                ></div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Deportes Habilitados</span>
              <div className="text-xl font-bold text-amber-600">
                {sports.length} / {subscription.limits.sports ?? '∞ Ilimitados'}
              </div>
              <span className="text-xs text-slate-500 block">
                {subscription.limits.sports ? 'Límite Free alcanzado' : 'Sin restricciones'}
              </span>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Facturación SUNAT</span>
              <div
                className={`text-xl font-bold ${
                  subscription.features.SUNAT_BILLING ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {subscription.features.SUNAT_BILLING ? 'HABILITADA' : 'RESTRINGIDA'}
              </div>
              <span className="text-xs text-slate-500 block">
                {subscription.features.SUNAT_BILLING ? 'Boletas y Facturas PRO' : 'Suscripción PRO requerida'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO DEPORTE */}
      {showSportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-slate-900 font-bold text-base md:text-lg flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-500" /> Registrar Nueva Disciplina
              </h3>
              <button
                onClick={() => setShowSportModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSport} className="space-y-4">
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Nombre del Deporte</label>
                <input
                  type="text"
                  placeholder="ej. Básquetbol Formativo"
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Categorías de edad (separadas por comas)</label>
                <input
                  type="text"
                  placeholder="Sub-8, Sub-10, Sub-12, Sub-15"
                  value={newSportCategories}
                  onChange={(e) => setNewSportCategories(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Canchas asignadas</label>
                <input
                  type="text"
                  placeholder="Coliseo 1, Cancha Principal"
                  value={newSportCourts}
                  onChange={(e) => setNewSportCourts(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Pensión Mensual Sugerida (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newSportFee}
                  onChange={(e) => setNewSportFee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-emerald-600 font-bold text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Descripción Breve</label>
                <textarea
                  placeholder="Metodología y objetivos de la disciplina..."
                  value={newSportDesc}
                  onChange={(e) => setNewSportDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSportModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs md:text-sm transition cursor-pointer shadow-xs"
                >
                  Registrar Deporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO PERSONAL */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-slate-900 font-bold text-base md:text-lg flex items-center gap-2.5">
                <Users className="w-5 h-5 text-blue-600" /> Registrar Entrenador o Personal
              </h3>
              <button
                onClick={() => setShowStaffModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">DNI (8 dígitos)</label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="72819203"
                    value={newStaffDni}
                    onChange={(e) => setNewStaffDni(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Rol en Sistema</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="COACH">COACH (Profesor)</option>
                    <option value="ADMIN">ADMIN (Administrador)</option>
                    <option value="CASHIER">CASHIER (Caja/Cobros)</option>
                    <option value="STAFF">STAFF (Recepción)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Nombre Completo y Apellidos</label>
                <input
                  type="text"
                  placeholder="ej. Juan Carlos Guerrero"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Cargo / Título Profesional</label>
                <input
                  type="text"
                  placeholder="ej. Entrenador Categorías Sub-10 a Sub-14"
                  value={newStaffRoleTitle}
                  onChange={(e) => setNewStaffRoleTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Teléfono Celular</label>
                  <input
                    type="text"
                    placeholder="+51 987 654 321"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Disciplina Asignada</label>
                  <select
                    value={newStaffSport}
                    onChange={(e) => setNewStaffSport(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    {sports.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs md:text-sm transition cursor-pointer shadow-xs"
                >
                  Registrar Personal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA TARIFA */}
      {showTariffModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-slate-900 font-bold text-base md:text-lg flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-emerald-600" /> Crear Nueva Tarifa
              </h3>
              <button
                onClick={() => setShowTariffModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTariff} className="space-y-4">
              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Nombre de la Tarifa</label>
                <input
                  type="text"
                  placeholder="ej. Pensión Fútbol Formativo"
                  value={newTariffName}
                  onChange={(e) => setNewTariffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Tipo de Cobro</label>
                  <select
                    value={newTariffType}
                    onChange={(e) => setNewTariffType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="MONTHLY">Pensión Mensual</option>
                    <option value="ENROLLMENT">Matrícula Anual</option>
                    <option value="UNIFORM">Indumentaria / Uniforme</option>
                    <option value="TRIAL">Clase de Prueba</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Monto en Soles (PEN)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTariffAmount}
                    onChange={(e) => setNewTariffAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-emerald-600 font-bold text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Día de Vencimiento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={newTariffDueDay}
                    onChange={(e) => setNewTariffDueDay(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Descuento Pago Puntual (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTariffDiscount}
                    onChange={(e) => setNewTariffDiscount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-amber-600 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Disciplina Aplicable</label>
                <select
                  value={newTariffSport}
                  onChange={(e) => setNewTariffSport(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Todos">Todas las Disciplinas</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-slate-700 block mb-1.5">Descripción</label>
                <textarea
                  placeholder="Detalles sobre lo que incluye esta tarifa..."
                  value={newTariffDesc}
                  onChange={(e) => setNewTariffDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTariffModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs md:text-sm transition cursor-pointer shadow-xs"
                >
                  Crear Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
