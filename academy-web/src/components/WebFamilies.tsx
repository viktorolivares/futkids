import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  FileText,
  UserPlus,
  ShieldAlert,
  ExternalLink,
  MessageCircle,
  Coins,
  X,
  Building,
  Award,
  Calendar,
  Sparkles,
  Printer,
  ChevronRight,
  HelpCircle,
  Info,
  Check,
} from 'lucide-react';
import {
  WebFamily,
  WebFamilyContact,
  WebStudent,
  WebCharge,
  WebPayment,
  WebCustomerCredit,
  WebGroup,
  WebBillingInvoice,
} from '../types';

interface WebFamiliesProps {
  families: WebFamily[];
  students: WebStudent[];
  groups: WebGroup[];
  charges: WebCharge[];
  payments: WebPayment[];
  customerCredits: WebCustomerCredit[];
  invoices?: WebBillingInvoice[];
  onAddFamily: (newFamily: WebFamily) => void;
  onUpdateFamily: (updatedFamily: WebFamily) => void;
  onAddStudent: (newStudent: WebStudent) => void;
  onGoToCashierForStudent: (studentId: string) => void;
  onGoToCashierForFamily?: (family: WebFamily) => void;
}

export const WebFamilies: React.FC<WebFamiliesProps> = ({
  families,
  students,
  groups,
  charges,
  payments,
  customerCredits,
  invoices = [],
  onAddFamily,
  onUpdateFamily,
  onAddStudent,
  onGoToCashierForStudent,
  onGoToCashierForFamily,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WITH_DEBT' | 'SIBLINGS' | 'WITH_CREDIT'>('ALL');

  // Modals state
  const [showNewFamilyModal, setShowNewFamilyModal] = useState(false);
  const [statementFamily, setStatementFamily] = useState<WebFamily | null>(null);
  const [addingSiblingFamily, setAddingSiblingFamily] = useState<WebFamily | null>(null);
  const [managingContactsFamily, setManagingContactsFamily] = useState<WebFamily | null>(null);

  // Form states: New Family
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyNotes, setNewFamilyNotes] = useState('');
  const [primaryRelationship, setPrimaryRelationship] = useState<'PADRE' | 'MADRE' | 'APODERADO' | 'TUTOR'>('PADRE');
  const [primaryFullName, setPrimaryFullName] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryDoc, setPrimaryDoc] = useState('');

  // Form states: Add Sibling
  const [siblingName, setSiblingName] = useState('');
  const [siblingBirthDate, setSiblingBirthDate] = useState('2017-05-10');
  const [siblingDoc, setSiblingDoc] = useState('');
  const [siblingSport, setSiblingSport] = useState('Fútbol Formativo');
  const [siblingGroup, setSiblingGroup] = useState(groups[0]?.name || 'Sub-10 A (Cancha 1)');
  const [siblingMedical, setSiblingMedical] = useState('Ninguna alergia registrada.');
  const [applySiblingDiscount, setApplySiblingDiscount] = useState(true);

  // Form states: Add Contact
  const [newContactRel, setNewContactRel] = useState<'PADRE' | 'MADRE' | 'APODERADO' | 'TUTOR'>('MADRE');
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactDoc, setNewContactDoc] = useState('');
  const [newContactIsPrimary, setNewContactIsPrimary] = useState(false);

  // Helpers
  const getFamilyStudents = (fam: WebFamily) => {
    return students.filter((s) => s.familyId === fam.id || fam.studentIds?.includes(s.id));
  };

  const getFamilyTotalDebt = (fam: WebFamily) => {
    const famStudents = getFamilyStudents(fam);
    return famStudents.reduce((acc, s) => acc + (s.balance > 0 ? s.balance : 0), 0);
  };

  const getFamilyCredit = (fam: WebFamily) => {
    return customerCredits
      .filter((c) => c.familyId === fam.id && c.status === 'AVAILABLE' && c.remaining > 0)
      .reduce((acc, c) => acc + c.remaining, 0);
  };

  // KPIs
  const totalFamiliesCount = families.length;
  const multiChildrenFamilies = families.filter((f) => getFamilyStudents(f).length > 1).length;
  const totalConsolidatedDebt = families.reduce((acc, f) => acc + getFamilyTotalDebt(f), 0);
  const totalAvailableCredit = customerCredits
    .filter((c) => c.status === 'AVAILABLE' && c.remaining > 0)
    .reduce((acc, c) => acc + c.remaining, 0);

  // Filtering
  const filteredFamilies = families.filter((fam) => {
    const famStudents = getFamilyStudents(fam);
    const totalDebt = getFamilyTotalDebt(fam);
    const totalCredit = getFamilyCredit(fam);

    if (filterType === 'WITH_DEBT' && totalDebt <= 0) return false;
    if (filterType === 'SIBLINGS' && famStudents.length <= 1) return false;
    if (filterType === 'WITH_CREDIT' && totalCredit <= 0) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    const matchesName = fam.name.toLowerCase().includes(term);
    const matchesCode = fam.code.toLowerCase().includes(term);
    const matchesContact = fam.contacts.some(
      (c) =>
        c.fullName.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.documentNumber && c.documentNumber.includes(term))
    );
    const matchesStudent = famStudents.some((s) => s.name.toLowerCase().includes(term));

    return matchesName || matchesCode || matchesContact || matchesStudent;
  });

  const handleCreateFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim() || !primaryFullName.trim() || !primaryPhone.trim()) return;

    const famId = `fam-${Date.now()}`;
    const nextCodeNum = families.length + 1;
    const code = `FAM-${nextCodeNum.toString().padStart(3, '0')}`;

    const newFamily: WebFamily = {
      id: famId,
      academyId: 'acad-alianza-01',
      code,
      name: newFamilyName.trim(),
      notes: newFamilyNotes.trim() || undefined,
      source: 'DIRECT',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      contacts: [
        {
          id: `cnt-${Date.now()}`,
          familyId: famId,
          relationship: primaryRelationship,
          fullName: primaryFullName.trim(),
          phone: primaryPhone.trim(),
          email: primaryEmail.trim() || undefined,
          documentNumber: primaryDoc.trim() || undefined,
          isPrimary: true,
        },
      ],
      studentIds: [],
    };

    onAddFamily(newFamily);
    setShowNewFamilyModal(false);

    // Reset form
    setNewFamilyName('');
    setNewFamilyNotes('');
    setPrimaryFullName('');
    setPrimaryPhone('');
    setPrimaryEmail('');
    setPrimaryDoc('');
  };

  const handleCreateSibling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingSiblingFamily || !siblingName.trim()) return;

    const baseFee = 180.0;
    const discountPct = applySiblingDiscount ? 15 : 0;
    const finalFee = discountPct > 0 ? baseFee * (1 - discountPct / 100) : baseFee;
    const primaryContact = addingSiblingFamily.contacts.find((c) => c.isPrimary) || addingSiblingFamily.contacts[0];

    // Compute age from birthDate
    const birthYear = parseInt(siblingBirthDate.substring(0, 4), 10) || 2017;
    const currentYear = new Date().getFullYear();
    const age = Math.max(4, currentYear - birthYear);

    const newStu: WebStudent = {
      id: `stu-${Date.now()}`,
      academyId: addingSiblingFamily.academyId,
      name: siblingName.trim(),
      familyId: addingSiblingFamily.id,
      familyName: addingSiblingFamily.name,
      contactName: primaryContact ? `${primaryContact.fullName} (${primaryContact.relationship})` : 'Apoderado',
      phone: primaryContact?.phone || '+51 999 999 999',
      email: primaryContact?.email || 'apoderado@academia.pe',
      documentType: 'DNI',
      documentNumber: siblingDoc.trim() || '79821034',
      birthDate: siblingBirthDate,
      age,
      sport: siblingSport,
      groupName: siblingGroup,
      status: 'ACTIVE',
      monthlyFee: baseFee,
      scholarshipType: applySiblingDiscount ? 'SIBLING_DISCOUNT' : 'NONE',
      scholarshipDiscountPct: applySiblingDiscount ? 15 : undefined,
      scholarshipReason: applySiblingDiscount ? `Descuento Hermano matriculado (${addingSiblingFamily.name})` : undefined,
      scholarshipApprovedBy: applySiblingDiscount ? 'Política de Academia' : undefined,
      finalMonthlyFee: finalFee,
      balance: finalFee, // Inicia con cargo de pensión del mes
      emergencyPhone: primaryContact?.phone || '+51 999 999 999',
      medicalNotes: siblingMedical,
      attendanceRate: 100,
    };

    onAddStudent(newStu);

    // Update family studentIds
    const updatedFam: WebFamily = {
      ...addingSiblingFamily,
      studentIds: [...(addingSiblingFamily.studentIds || []), newStu.id],
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    onUpdateFamily(updatedFam);

    setAddingSiblingFamily(null);
    setSiblingName('');
    setSiblingDoc('');
  };

  const handleAddContactToFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingContactsFamily || !newContactName.trim() || !newContactPhone.trim()) return;

    let updatedContacts = [...managingContactsFamily.contacts];

    if (newContactIsPrimary) {
      updatedContacts = updatedContacts.map((c) => ({ ...c, isPrimary: false }));
    }

    const createdContact: WebFamilyContact = {
      id: `cnt-${Date.now()}`,
      familyId: managingContactsFamily.id,
      relationship: newContactRel,
      fullName: newContactName.trim(),
      phone: newContactPhone.trim(),
      email: newContactEmail.trim() || undefined,
      documentNumber: newContactDoc.trim() || undefined,
      isPrimary: newContactIsPrimary || updatedContacts.length === 0,
    };

    updatedContacts.push(createdContact);

    const updatedFam: WebFamily = {
      ...managingContactsFamily,
      contacts: updatedContacts,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onUpdateFamily(updatedFam);
    setManagingContactsFamily(updatedFam);

    // Reset contact fields
    setNewContactName('');
    setNewContactPhone('');
    setNewContactEmail('');
    setNewContactDoc('');
    setNewContactIsPrimary(false);
  };

  const handleSetPrimaryContact = (contactId: string) => {
    if (!managingContactsFamily) return;

    const updatedContacts = managingContactsFamily.contacts.map((c) => ({
      ...c,
      isPrimary: c.id === contactId,
    }));

    const updatedFam: WebFamily = {
      ...managingContactsFamily,
      contacts: updatedContacts,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onUpdateFamily(updatedFam);
    setManagingContactsFamily(updatedFam);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Familias Registradas</span>
            <Users className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1.5">{totalFamiliesCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Núcleos familiares en sede</div>
        </div>

        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Familias con Hermanos</span>
            <Award className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1.5">{multiChildrenFamilies}</div>
          <div className="text-[10px] text-purple-300/80 mt-1">Con descuento de hermanos (-15%)</div>
        </div>

        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Deuda Consolidada</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1.5">
            S/ {totalConsolidatedDebt.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Suma acumulada de todos los hijos</div>
        </div>

        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Saldos a Favor Familias</span>
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1.5">
            S/ {totalAvailableCredit.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-300/80 mt-1">Disponibles para amortizar cuotas</div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por familia, apoderado, DNI o alumno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161B22] border border-slate-700/80 rounded pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1.5 rounded transition cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-[#161B22] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todas ({families.length})
            </button>
            <button
              onClick={() => setFilterType('WITH_DEBT')}
              className={`px-2.5 py-1.5 rounded transition cursor-pointer ${
                filterType === 'WITH_DEBT'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/50 font-bold'
                  : 'bg-[#161B22] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Con Deuda
            </button>
            <button
              onClick={() => setFilterType('SIBLINGS')}
              className={`px-2.5 py-1.5 rounded transition cursor-pointer ${
                filterType === 'SIBLINGS'
                  ? 'bg-purple-950 text-purple-300 border border-purple-500/50 font-bold'
                  : 'bg-[#161B22] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Hermanos ({multiChildrenFamilies})
            </button>
            <button
              onClick={() => setFilterType('WITH_CREDIT')}
              className={`px-2.5 py-1.5 rounded transition cursor-pointer ${
                filterType === 'WITH_CREDIT'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'bg-[#161B22] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Con Saldo a Favor
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowNewFamilyModal(true)}
          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded flex items-center gap-1.5 text-xs transition shrink-0 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Registrar Nueva Familia</span>
        </button>
      </div>

      {/* Families Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {filteredFamilies.map((fam) => {
          const famStudents = getFamilyStudents(fam);
          const totalDebt = getFamilyTotalDebt(fam);
          const totalCredit = getFamilyCredit(fam);
          const primaryContact = fam.contacts.find((c) => c.isPrimary) || fam.contacts[0];
          const secondaryContacts = fam.contacts.filter((c) => c.id !== primaryContact?.id);

          return (
            <div
              key={fam.id}
              className="bg-[#0F1219] border border-slate-800 hover:border-slate-700/80 rounded-lg p-4 space-y-3.5 transition flex flex-col justify-between"
            >
              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{fam.name}</span>
                      <span className="text-[10px] bg-slate-800 text-sky-400 border border-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">
                        {fam.code}
                      </span>
                      {famStudents.length > 1 && (
                        <span className="text-[9px] bg-purple-950/60 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                          <Award className="w-2.5 h-2.5" />
                          <span>{famStudents.length} Hermanos</span>
                        </span>
                      )}
                    </div>
                    {fam.notes && (
                      <p className="text-[10px] text-slate-400 mt-1 italic">
                        "{fam.notes}"
                      </p>
                    )}
                  </div>

                  {/* Financial Balance Badge */}
                  <div className="text-right shrink-0">
                    {totalDebt > 0 ? (
                      <div className="bg-rose-950/40 border border-rose-500/40 rounded px-2.5 py-1 text-right">
                        <div className="text-[8px] text-rose-300/80 uppercase font-bold">Deuda Familiar</div>
                        <div className="text-xs font-bold text-rose-400">
                          S/ {totalDebt.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-950/40 border border-emerald-500/40 rounded px-2.5 py-1 text-right">
                        <div className="text-[8px] text-emerald-300/80 uppercase font-bold">Estado Familiar</div>
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Al Día</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Contact Details */}
                {primaryContact && (
                  <div className="bg-[#161B22] border border-slate-800/80 rounded p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">★ {primaryContact.fullName}</span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                          {primaryContact.relationship} (TITULAR)
                        </span>
                        {primaryContact.documentNumber && (
                          <span className="text-[9px] text-slate-500 font-mono">
                            DNI: {primaryContact.documentNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${primaryContact.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px] bg-emerald-950/40 hover:bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/30 transition"
                          title="Enviar WhatsApp al apoderado"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${primaryContact.phone}`}
                          className="text-slate-300 hover:text-white flex items-center gap-1 text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 transition"
                          title="Llamar"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{primaryContact.phone}</span>
                        </a>
                      </div>
                    </div>

                    {primaryContact.email && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{primaryContact.email}</span>
                      </div>
                    )}

                    {/* Secondary contacts list */}
                    {secondaryContacts.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                          Otros Apoderados Registrados ({secondaryContacts.length}):
                        </div>
                        {secondaryContacts.map((sc) => (
                          <div key={sc.id} className="flex items-center justify-between">
                            <span>
                              • {sc.fullName} ({sc.relationship})
                            </span>
                            <span className="text-slate-500 font-mono">{sc.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sibling Students List */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center justify-between">
                    <span>Hijos Matriculados ({famStudents.length})</span>
                    {totalCredit > 0 && (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                        <Coins className="w-3 h-3" />
                        <span>Saldo a Favor Familiar: S/ {totalCredit.toFixed(2)}</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {famStudents.map((s) => (
                      <div
                        key={s.id}
                        className="bg-[#12161F] border border-slate-800/80 rounded px-2.5 py-1.5 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-200">{s.name}</span>
                            <span className="text-[9px] text-slate-500">({s.age} años)</span>
                            <span className="text-[9px] bg-slate-800 text-sky-300 px-1.5 py-0.2 rounded">
                              {s.groupName}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Cuota: S/ {(s.finalMonthlyFee ?? s.monthlyFee).toFixed(2)}/mes
                            {s.scholarshipType && s.scholarshipType !== 'NONE' && (
                              <span className="text-purple-400 ml-1.5 font-bold">
                                [{s.scholarshipType === 'SIBLING_DISCOUNT' ? 'Desc. Hermano -15%' : s.scholarshipType}]
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          {s.balance > 0 ? (
                            <span className="text-rose-400 font-bold text-[10px]">
                              Debe S/ {s.balance.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                              <span>Al día</span>
                            </span>
                          )}

                          <button
                            onClick={() => onGoToCashierForStudent(s.id)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[9px] font-bold cursor-pointer"
                            title="Cobrar en caja"
                          >
                            Cobrar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2.5 border-t border-slate-800/90 flex items-center justify-between flex-wrap gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setStatementFamily(fam)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-sky-400" />
                    <span>Estado de Cuenta</span>
                  </button>

                  <button
                    onClick={() => setManagingContactsFamily(fam)}
                    className="px-2.5 py-1 bg-slate-800/60 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 transition cursor-pointer"
                  >
                    <Users className="w-3 h-3 text-emerald-400" />
                    <span>Apoderados</span>
                  </button>

                  {totalDebt > 0 && onGoToCashierForFamily && (
                    <button
                      onClick={() => onGoToCashierForFamily(fam)}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded flex items-center gap-1 transition cursor-pointer shadow-sm"
                      title="Abrir caja en modo Cobro Consolidado Familiar"
                    >
                      <DollarSign className="w-3 h-3 text-black stroke-[2.5]" />
                      <span>Cobro Familiar (S/ {totalDebt.toFixed(2)})</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setAddingSiblingFamily(fam);
                    setApplySiblingDiscount(true);
                  }}
                  className="px-2.5 py-1 bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 rounded font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <UserPlus className="w-3 h-3 text-purple-400" />
                  <span>+ Agregar Hermano</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: REGISTRAR NUEVA FAMILIA */}
      {showNewFamilyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-700 text-slate-200 max-w-lg w-full p-5 rounded-lg shadow-2xl space-y-3.5 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Registrar Nuevo Núcleo Familiar</span>
              </span>
              <button
                onClick={() => setShowNewFamilyModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFamily} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Nombre de la Familia (Apellidos) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Familia Morales Santillán"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold text-xs"
                />
              </div>

              {/* Apoderado Titular */}
              <div className="p-3 bg-[#161B22] border border-slate-800 rounded space-y-2.5">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Datos del Apoderado Titular (Contacto Principal)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Parentesco</label>
                    <select
                      value={primaryRelationship}
                      onChange={(e) => setPrimaryRelationship(e.target.value as any)}
                      className="w-full bg-[#0F1219] border border-slate-700 rounded px-2 py-1.5 text-white text-xs"
                    >
                      <option value="PADRE">Padre</option>
                      <option value="MADRE">Madre</option>
                      <option value="APODERADO">Apoderado Legal</option>
                      <option value="TUTOR">Tutor</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">DNI / CE</label>
                    <input
                      type="text"
                      placeholder="8 dígitos"
                      value={primaryDoc}
                      onChange={(e) => setPrimaryDoc(e.target.value)}
                      className="w-full bg-[#0F1219] border border-slate-700 rounded px-2 py-1.5 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Nombre Completo del Apoderado *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Morales Quispe"
                    value={primaryFullName}
                    onChange={(e) => setPrimaryFullName(e.target.value)}
                    className="w-full bg-[#0F1219] border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Teléfono Móvil (WhatsApp) *</label>
                    <input
                      type="text"
                      required
                      placeholder="+51 987 654 321"
                      value={primaryPhone}
                      onChange={(e) => setPrimaryPhone(e.target.value)}
                      className="w-full bg-[#0F1219] border border-slate-700 rounded px-2 py-1.5 text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={primaryEmail}
                      onChange={(e) => setPrimaryEmail(e.target.value)}
                      className="w-full bg-[#0F1219] border border-slate-700 rounded px-2 py-1.5 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Notas Administrativas / Restricciones de Entrega
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Autorizado para recoger al alumno: abuela María. Facturación a nombre de RUC..."
                  value={newFamilyNotes}
                  onChange={(e) => setNewFamilyNotes(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewFamilyModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded cursor-pointer"
                >
                  Guardar Familia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ESTADO DE CUENTA CONSOLIDADO FAMILIAR */}
      {statementFamily && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-700 text-slate-200 max-w-2xl w-full p-5 rounded-lg shadow-2xl space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-sm uppercase">
                    Estado de Cuenta Consolidado
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {statementFamily.name} • Código: <span className="text-sky-400 font-mono">{statementFamily.code}</span>
                </div>
              </div>
              <button
                onClick={() => setStatementFamily(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Apoderados y Contacto */}
            <div className="bg-[#161B22] border border-slate-800 rounded p-3 text-[11px] grid grid-cols-2 gap-2">
              <div>
                <div className="text-slate-500 text-[9px] uppercase">Apoderado Titular</div>
                <div className="font-bold text-slate-200">
                  {statementFamily.contacts.find((c) => c.isPrimary)?.fullName || statementFamily.contacts[0]?.fullName}
                </div>
                <div className="text-slate-400 text-[10px]">
                  DNI: {statementFamily.contacts.find((c) => c.isPrimary)?.documentNumber || '74829103'} • Tel: {statementFamily.contacts.find((c) => c.isPrimary)?.phone}
                </div>
              </div>

              <div className="text-right">
                <div className="text-slate-500 text-[9px] uppercase">Deuda Total Consolidada</div>
                <div className="text-base font-bold text-rose-400">
                  S/ {getFamilyTotalDebt(statementFamily).toFixed(2)}
                </div>
                {getFamilyCredit(statementFamily) > 0 && (
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    Saldo a favor disponible: S/ {getFamilyCredit(statementFamily).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Desglose por Hijo */}
            <div className="space-y-2">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">
                Detalle por Alumnos Inscritos ({getFamilyStudents(statementFamily).length})
              </span>

              <div className="space-y-2">
                {getFamilyStudents(statementFamily).map((stu) => {
                  const stuCharges = charges.filter((c) => c.studentName === stu.name);
                  const stuPayments = payments.filter((p) => p.studentName === stu.name);

                  return (
                    <div
                      key={stu.id}
                      className="bg-[#161B22] border border-slate-800 rounded p-3 space-y-2 text-[11px]"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                        <div>
                          <span className="font-bold text-slate-200">{stu.name}</span>
                          <span className="text-slate-400 text-[10px] ml-2">
                            {stu.sport} • {stu.groupName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px]">Cuota neta: </span>
                          <span className="font-bold text-white">S/ {(stu.finalMonthlyFee ?? stu.monthlyFee).toFixed(2)}/mes</span>
                        </div>
                      </div>

                      {/* Cargos y Pagos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                        <div className="space-y-1">
                          <div className="text-slate-500 uppercase font-bold text-[9px]">Últimos Cargos</div>
                          {stuCharges.length > 0 ? (
                            stuCharges.map((ch) => (
                              <div key={ch.id} className="flex justify-between text-slate-300">
                                <span>{ch.description}</span>
                                <span className={ch.status === 'PAID' ? 'text-emerald-400' : 'text-rose-400'}>
                                  S/ {ch.amount.toFixed(2)} ({ch.status})
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">Sin cargos pendientes</div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="text-slate-500 uppercase font-bold text-[9px]">Últimos Pagos Registrados</div>
                          {stuPayments.length > 0 ? (
                            stuPayments.map((py) => (
                              <div key={py.id} className="flex justify-between text-slate-300">
                                <span>{py.description} ({py.paymentMethod})</span>
                                <span className="text-emerald-400 font-bold">
                                  S/ {py.amount.toFixed(2)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">No registra pagos recientes</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="text-[10px] text-slate-500">
                * Estado de cuenta oficial emitido por el sistema académico.
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {getFamilyTotalDebt(statementFamily) > 0 && onGoToCashierForFamily && (
                  <button
                    onClick={() => {
                      const fam = statementFamily;
                      setStatementFamily(null);
                      onGoToCashierForFamily(fam);
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
                  >
                    <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Cobrar Deuda en Caja (S/ {getFamilyTotalDebt(statementFamily).toFixed(2)})</span>
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>

                {statementFamily.contacts[0]?.phone && (
                  <a
                    href={`https://wa.me/${statementFamily.contacts[0].phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hola ${statementFamily.name}, le compartimos el resumen de su Estado de Cuenta Consolidado en la Academia Alianza Lima. Deuda pendiente: S/ ${getFamilyTotalDebt(statementFamily).toFixed(2)}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Enviar por WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AGREGAR HERMANO / NUEVO ALUMNO A FAMILIA */}
      {addingSiblingFamily && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-700 text-slate-200 max-w-md w-full p-5 rounded-lg shadow-2xl space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span>Inscribir Hermano en {addingSiblingFamily.name}</span>
              </span>
              <button
                onClick={() => setAddingSiblingFamily(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSibling} className="space-y-3">
              <div className="p-2.5 bg-purple-950/20 border border-purple-500/30 rounded text-[11px] text-purple-300">
                Al ser hermano de un alumno ya activo, se vincula automáticamente a los mismos apoderados y contactos de emergencia.
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Nombres y Apellidos del Hermano *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Piero Cueva Tapia"
                  value={siblingName}
                  onChange={(e) => setSiblingName(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    required
                    value={siblingBirthDate}
                    onChange={(e) => setSiblingBirthDate(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">DNI Alumno</label>
                  <input
                    type="text"
                    required
                    placeholder="8 dígitos"
                    value={siblingDoc}
                    onChange={(e) => setSiblingDoc(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Deporte</label>
                  <select
                    value={siblingSport}
                    onChange={(e) => setSiblingSport(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white text-xs"
                  >
                    <option value="Fútbol Formativo">Fútbol Formativo</option>
                    <option value="Fútbol Femenino">Fútbol Femenino</option>
                    <option value="Baloncesto">Baloncesto</option>
                    <option value="Voleibol">Voleibol</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Grupo / Horario</label>
                  <select
                    value={siblingGroup}
                    onChange={(e) => setSiblingGroup(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white text-xs"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Beneficio de Hermano */}
              <div className="p-2.5 bg-[#161B22] border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <div className="font-bold text-purple-300 text-[11px]">
                    Aplicar Política Descuento Hermanos (-15%)
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Base: S/ 180.00 → Cuota neta final: S/ 153.00/mes
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={applySiblingDiscount}
                  onChange={(e) => setApplySiblingDiscount(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddingSiblingFamily(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded cursor-pointer"
                >
                  Matricular Hermano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: GESTIONAR APODERADOS DE FAMILIA */}
      {managingContactsFamily && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-700 text-slate-200 max-w-lg w-full p-5 rounded-lg shadow-2xl space-y-3.5 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Apoderados de {managingContactsFamily.name}</span>
              </span>
              <button
                onClick={() => setManagingContactsFamily(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of existing contacts */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Contactos Registrados</span>
              {managingContactsFamily.contacts.map((cnt) => (
                <div
                  key={cnt.id}
                  className="p-2.5 bg-[#161B22] border border-slate-800 rounded flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{cnt.fullName}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                        {cnt.relationship}
                      </span>
                      {cnt.isPrimary && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                          TITULAR
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Tel: {cnt.phone} {cnt.documentNumber && `• DNI: ${cnt.documentNumber}`} {cnt.email && `• ${cnt.email}`}
                    </div>
                  </div>

                  {!cnt.isPrimary && (
                    <button
                      onClick={() => handleSetPrimaryContact(cnt.id)}
                      className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded cursor-pointer"
                    >
                      Hacer Titular
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new contact form */}
            <form onSubmit={handleAddContactToFamily} className="p-3 bg-[#161B22] border border-slate-800 rounded space-y-2.5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                + Agregar Nuevo Apoderado / Tutor
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Parentesco</label>
                  <select
                    value={newContactRel}
                    onChange={(e) => setNewContactRel(e.target.value as any)}
                    className="w-full bg-[#0F1219] border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  >
                    <option value="PADRE">Padre</option>
                    <option value="MADRE">Madre</option>
                    <option value="APODERADO">Apoderado Legal</option>
                    <option value="TUTOR">Tutor</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">DNI / CE</label>
                  <input
                    type="text"
                    placeholder="8 dígitos"
                    value={newContactDoc}
                    onChange={(e) => setNewContactDoc(e.target.value)}
                    className="w-full bg-[#0F1219] border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carmen Rivas Toledo"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-[#0F1219] border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Teléfono Móvil *</label>
                  <input
                    type="text"
                    required
                    placeholder="+51 991 234 568"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full bg-[#0F1219] border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full bg-[#0F1219] border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newContactIsPrimary}
                    onChange={(e) => setNewContactIsPrimary(e.target.checked)}
                    className="accent-emerald-400"
                  />
                  <span>Designar como Apoderado Titular</span>
                </label>

                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded cursor-pointer"
                >
                  Agregar Contacto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
