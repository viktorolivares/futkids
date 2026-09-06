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
} from 'lucide-react';
import {
  WebAcademyProfile,
  WebSportItem,
  WebStaffMember,
  WebFeeTariff,
  SubscriptionStatusInfo,
} from '../types';
import { WebSunatCertUploader } from './WebSunatCertUploader';

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
    <div className="space-y-4">
      {/* Header Context Banner */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono">
        <div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-bold uppercase">
              MÓDULO DE ADMINISTRACIÓN
            </span>
            <span className="text-slate-400 font-bold uppercase">{profileForm.name}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">RUC {profileForm.ruc}</span>
          </div>
          <h1 className="text-base font-bold text-white mt-1 uppercase tracking-wide">
            Panel de Gestión Administrativa de la Academia
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuración general de sede, disciplinas deportivas, plantilla de entrenadores, catálogo de tarifas y enlaces SUNAT.
          </p>
        </div>

        {/* Quick SaaS Plan Status Chip */}
        {subscription && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPlansModal}
              className={`px-3 py-1.5 rounded text-[11px] font-bold border flex items-center gap-1.5 transition ${
                subscription.status === 'TRIALING'
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-300 hover:bg-purple-900/60'
                  : subscription.plan.code === 'PRO'
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>PLAN {subscription.plan.name.toUpperCase()}</span>
              {subscription.status === 'TRIALING' && (
                <span className="bg-purple-500/20 text-purple-200 px-1.5 py-0.2 rounded text-[10px]">
                  {subscription.trial.remainingDays}d prueba
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-[#161B22] border border-slate-800 rounded p-1 flex items-center gap-1 overflow-x-auto text-xs font-mono">
        {[
          { id: 'profile', label: '1. Sede & Datos Fiscales', icon: Building2 },
          { id: 'sports', label: `2. Deportes & Disciplinas (${sports.length})`, icon: Trophy },
          { id: 'staff', label: `3. Staff & Entrenadores (${staff.length})`, icon: Users },
          { id: 'tariffs', label: `4. Catálogo de Tarifas (${tariffs.length})`, icon: CreditCard },
          { id: 'sunat', label: '5. Configuración SUNAT SOL', icon: ShieldCheck },
          { id: 'saas', label: '6. Límites SaaS & Plan', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminSubTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold uppercase transition whitespace-nowrap ${
                isActive
                  ? 'bg-sky-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PERFIL & DATOS FISCALES */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-[#0F1219] border border-slate-800 rounded p-4 space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                Información Institucional y Legal de la Sede
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Datos de la entidad emisora, dirección física y canales oficiales de comunicación con padres de familia.
              </p>
            </div>
            {isSaved && (
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded border border-emerald-500/40 flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" /> Cambios Guardados
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">NOMBRE COMERCIAL DE LA SEDE</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">RAZÓN SOCIAL (EMISOR TRIBUTARIO)</label>
              <input
                type="text"
                value={profileForm.legalName}
                onChange={(e) => setProfileForm({ ...profileForm, legalName: e.target.value })}
                className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">RUC OFICIAL (11 DÍGITOS)</label>
              <input
                type="text"
                value={profileForm.ruc}
                onChange={(e) => setProfileForm({ ...profileForm, ruc: e.target.value })}
                className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white font-bold text-amber-300 focus:border-sky-500 focus:outline-none"
                maxLength={11}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-1 text-[11px]">DIRECCIÓN FÍSICA DE LA CANCHA / SEDE</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">DISTRITO / DEPARTAMENTO</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={profileForm.district}
                  onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
                  placeholder="Distrito"
                />
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
                  placeholder="Departamento"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">TELÉFONO DE RECEPCIÓN / FIJO</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">WHATSAPP OFICIAL PARA COBRANZAS</label>
              <div className="relative">
                <input
                  type="text"
                  value={profileForm.whatsapp}
                  onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-emerald-400 font-bold focus:border-sky-500 focus:outline-none pl-7"
                />
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">CORREO ELECTRÓNICO OFICIAL</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-slate-400 block mb-1 text-[11px]">HORARIOS DE ATENCIÓN Y APERTURA DE CANCHAS</label>
              <input
                type="text"
                value={profileForm.openingHours}
                onChange={(e) => setProfileForm({ ...profileForm, openingHours: e.target.value })}
                className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded text-xs flex items-center gap-1.5 transition shadow"
            >
              <Save className="w-3.5 h-3.5" /> Guardar Cambios Institucionales
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: DEPORTES & DISCIPLINAS */}
      {activeTab === 'sports' && (
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Catálogo de Deportes y Disciplinas Formativas
              </h2>
              <p className="text-[11px] text-slate-400">
                Disciplinas habilitadas en la sede con sus categorías por edad y áreas de entrenamiento.
              </p>
            </div>
            <button
              onClick={() => setShowSportModal(true)}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Deporte
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sports.map((sp) => (
              <div
                key={sp.id}
                className={`p-3.5 bg-[#0F1219] border rounded space-y-2.5 transition ${
                  sp.isActive ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 font-bold">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase">{sp.name}</h3>
                      <span className="text-[10px] text-slate-400">{sp.activeStudents} alumnos matriculados</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        sp.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {sp.isActive ? 'ACTIVO' : 'PAUSADO'}
                    </span>
                    <button
                      onClick={() => onToggleSportStatus(sp.id)}
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-800"
                    >
                      {sp.isActive ? 'Pausar' : 'Activar'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">{sp.description}</p>

                <div className="space-y-1.5 text-[10px] pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 uppercase">CATEGORÍAS:</span>
                    {sp.categories.map((c, i) => (
                      <span key={i} className="bg-[#161B22] text-slate-300 px-1.5 py-0.2 rounded border border-slate-800">
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 uppercase">CANCHAS ASIGNADAS:</span>
                    {sp.assignedCourts.map((court, i) => (
                      <span key={i} className="text-sky-400 bg-sky-950/40 px-1.5 py-0.2 rounded border border-sky-800/50">
                        {court}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-slate-400 pt-1">
                    <span>Pensión Sugerida:</span>
                    <span className="text-emerald-400 font-bold">S/ {sp.monthlyFee.toFixed(2)}/mes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF & ENTRENADORES */}
      {activeTab === 'staff' && (
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Equipo Técnico, Entrenadores y Personal Administrativo
              </h2>
              <p className="text-[11px] text-slate-400">
                Control de roles de acceso al sistema, asignación de disciplinas y teléfonos de contacto.
              </p>
            </div>
            <button
              onClick={() => setShowStaffModal(true)}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Personal
            </button>
          </div>

          <div className="bg-[#0F1219] border border-slate-800 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#161B22] text-slate-400 text-[10px] uppercase">
                  <th className="p-3">Nombre & Cargo</th>
                  <th className="p-3">DNI</th>
                  <th className="p-3">Rol Sistema</th>
                  <th className="p-3">Deportes Asignados</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {staff.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-bold text-white uppercase">{st.name}</div>
                      <div className="text-[10px] text-slate-400">{st.roleTitle}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono">{st.dni}</td>
                    <td className="p-3">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                          st.role === 'OWNER'
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                            : st.role === 'COACH'
                            ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                            : st.role === 'CASHIER'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {st.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {st.sports.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {st.sports.map((sp, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] bg-[#161B22] border border-slate-700 px-1.5 py-0.2 rounded text-slate-300"
                            >
                              {sp}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Administrativo / General</span>
                      )}
                    </td>
                    <td className="p-3 text-[11px]">
                      <div className="text-slate-300">{st.phone}</div>
                      <div className="text-[10px] text-slate-500">{st.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                        {st.status === 'ACTIVE' ? 'ACTIVO' : st.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {st.role !== 'OWNER' && onRemoveStaff && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Revocar acceso de ${st.name} a esta sede?`)) {
                              onRemoveStaff(st.id);
                            }
                          }}
                          className="px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-[10px] text-rose-300 font-bold transition cursor-pointer"
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
      )}

      {/* TAB 4: TARIFAS & MENSUALIDADES */}
      {activeTab === 'tariffs' && (
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Catálogo de Tarifas, Matrículas y Pensiones
              </h2>
              <p className="text-[11px] text-slate-400">
                Precios base en Soles (PEN) utilizados por el módulo de Caja para emitir cargos y cobranzas.
              </p>
            </div>
            <button
              onClick={() => setShowTariffModal(true)}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Tarifa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tariffs.map((trf) => (
              <div key={trf.id} className="bg-[#0F1219] border border-slate-800 rounded p-3.5 space-y-2">
                <div className="flex items-start justify-between">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                      trf.type === 'MONTHLY'
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                        : trf.type === 'ENROLLMENT'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {trf.type}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-400">
                      S/ {trf.amount.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-500 block uppercase">{trf.frequency}</span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-white uppercase">{trf.name}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{trf.description}</p>

                <div className="pt-2 border-t border-slate-800/80 text-[10px] space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Disciplina:</span>
                    <span className="text-slate-200 font-bold">{trf.sport}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vencimiento sugerido:</span>
                    <span className="text-slate-200 font-bold">Día {trf.dueDay} del mes</span>
                  </div>
                  {trf.earlyBirdDiscount > 0 && (
                    <div className="flex justify-between text-amber-300">
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
        <div className="space-y-4">
          {/* SaaS Pro Alert regarding SUNAT Billing */}
          <div
            className={`p-3 rounded border text-xs leading-relaxed font-mono ${
              isSunatPro
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {isSunatPro ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="uppercase">
                  {isSunatPro
                    ? 'Facturación Electrónica SUNAT Habilitada (Plan PRO Activo)'
                    : 'Aviso del Sistema: Emisión SUNAT Exclusiva del Plan PRO'}
                </strong>
                <p className="mt-1 text-[11px]">
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
          <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-3.5 font-mono text-xs">
            <div className="text-slate-400 font-bold uppercase text-[10px] mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Endpoints Oficiales WebServices SOAP de SUNAT (Perú)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 bg-[#161B22] border border-slate-800 rounded">
                <span className="text-sky-400 font-bold block mb-0.5">Ambiente Beta (Pruebas & Homologación):</span>
                <code className="text-slate-300 break-all">https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService</code>
              </div>
              <div className="p-2 bg-[#161B22] border border-slate-800 rounded">
                <span className="text-emerald-400 font-bold block mb-0.5">Ambiente Producción Oficial (Comprobantes Reales):</span>
                <code className="text-slate-300 break-all">https://e-factura.sunat.gob.pe/ol-ti-itcpe/billService</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LÍMITES SAAS & PLAN */}
      {activeTab === 'saas' && subscription && (
        <div className="bg-[#0F1219] border border-slate-800 rounded p-4 space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Estado de la Suscripción SaaS y Cuotas de Uso
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Consumo actual de recursos comparado contra los límites contratados en tu plan.
              </p>
            </div>
            <button
              onClick={onOpenPlansModal}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded text-xs flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Cambiar de Plan / Ver Tabla
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-[#161B22] border border-slate-800 rounded space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">PLAN CONTRATADO</span>
              <div className="text-lg font-bold text-white flex items-center gap-1.5">
                <span>{subscription.plan.name}</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded">
                  S/ {subscription.plan.priceMonthly.toFixed(2)}/mes
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Estado: <strong className="text-emerald-400">{subscription.status}</strong>
              </span>
            </div>

            <div className="p-3.5 bg-[#161B22] border border-slate-800 rounded space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">ALUMNOS ACTIVOS</span>
              <div className="text-lg font-bold text-sky-400">
                {subscription.usage.students} / {subscription.limits.students ?? '∞ Ilimitados'}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{
                    width: subscription.limits.students
                      ? `${Math.min(100, (subscription.usage.students / subscription.limits.students) * 100)}%`
                      : '35%',
                  }}
                ></div>
              </div>
            </div>

            <div className="p-3.5 bg-[#161B22] border border-slate-800 rounded space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">DEPORTES HABILITADOS</span>
              <div className="text-lg font-bold text-amber-400">
                {sports.length} / {subscription.limits.sports ?? '∞ Ilimitados'}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {subscription.limits.sports ? 'Límite Free alcanzado' : 'Sin restricción'}
              </span>
            </div>

            <div className="p-3.5 bg-[#161B22] border border-slate-800 rounded space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">FACTURACIÓN SUNAT</span>
              <div
                className={`text-lg font-bold ${
                  subscription.features.SUNAT_BILLING ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {subscription.features.SUNAT_BILLING ? 'HABILITADA' : 'RESTRINGIDA'}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {subscription.features.SUNAT_BILLING ? 'Boletas y Facturas PRO' : 'Suscripción PRO requerida'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO DEPORTE */}
      {showSportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-800 rounded max-w-md w-full p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-white font-bold uppercase flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Registrar Nueva Disciplina
              </h3>
              <button onClick={() => setShowSportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSport} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Nombre del Deporte</label>
                <input
                  type="text"
                  placeholder="ej. Básquetbol Formativo"
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Categorías de edad (separadas por comas)</label>
                <input
                  type="text"
                  placeholder="Sub-8, Sub-10, Sub-12, Sub-15"
                  value={newSportCategories}
                  onChange={(e) => setNewSportCategories(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Canchas asignadas</label>
                <input
                  type="text"
                  placeholder="Coliseo 1, Cancha Los Álamos"
                  value={newSportCourts}
                  onChange={(e) => setNewSportCourts(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Pensión Mensual Sugerida (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newSportFee}
                  onChange={(e) => setNewSportFee(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Descripción Breve</label>
                <textarea
                  placeholder="Metodología y objetivos..."
                  value={newSportDesc}
                  onChange={(e) => setNewSportDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSportModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-800 rounded max-w-md w-full p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-white font-bold uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" /> Registrar Entrenador / Personal
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">DNI (8 dígitos)</label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="72819203"
                    value={newStaffDni}
                    onChange={(e) => setNewStaffDni(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Rol en Sistema</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="COACH">COACH (Profesor)</option>
                    <option value="ADMIN">ADMIN (Administrador)</option>
                    <option value="CASHIER">CASHIER (Caja/Cobros)</option>
                    <option value="STAFF">STAFF (Recepción)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Nombre Completo y Apellidos</label>
                <input
                  type="text"
                  placeholder="ej. Juan Carlos Guerrero"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cargo / Título Profesional</label>
                <input
                  type="text"
                  placeholder="ej. Entrenador Categorías Sub-10 a Sub-14"
                  value={newStaffRoleTitle}
                  onChange={(e) => setNewStaffRoleTitle(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    placeholder="+51 987 654 321"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Deporte Asignado</label>
                  <select
                    value={newStaffSport}
                    onChange={(e) => setNewStaffSport(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                  >
                    {sports.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-800 rounded max-w-md w-full p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-white font-bold uppercase flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" /> Crear Nueva Tarifa
              </h3>
              <button onClick={() => setShowTariffModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTariff} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Nombre de la Tarifa</label>
                <input
                  type="text"
                  placeholder="ej. Pensión Fútbol Fin de Semana"
                  value={newTariffName}
                  onChange={(e) => setNewTariffName(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Tipo de Cobro</label>
                  <select
                    value={newTariffType}
                    onChange={(e) => setNewTariffType(e.target.value as any)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="MONTHLY">Pensión Mensual</option>
                    <option value="ENROLLMENT">Matrícula Anual</option>
                    <option value="UNIFORM">Indumentaria / Uniforme</option>
                    <option value="TRIAL">Clase de Prueba</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Monto en Soles (PEN)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTariffAmount}
                    onChange={(e) => setNewTariffAmount(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-emerald-400 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Día de Vencimiento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={newTariffDueDay}
                    onChange={(e) => setNewTariffDueDay(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Descuento Pago Puntual (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTariffDiscount}
                    onChange={(e) => setNewTariffDiscount(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-amber-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Disciplina Aplicable</label>
                <select
                  value={newTariffSport}
                  onChange={(e) => setNewTariffSport(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
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
                <label className="text-slate-400 block mb-1">Descripción</label>
                <textarea
                  placeholder="Detalles sobre lo que incluye esta tarifa..."
                  value={newTariffDesc}
                  onChange={(e) => setNewTariffDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTariffModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded"
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
