import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  HeartPulse,
  UserCheck,
  X,
  Check,
  Zap,
  Sparkles,
  Award,
  Tag,
  Percent,
  ShieldAlert,
  Info,
  Building,
} from 'lucide-react';
import {
  WebStudent,
  WebGroup,
  SubscriptionStatusInfo,
  ScholarshipType,
  WebFamily,
  WebCharge,
  WebPayment,
  WebCustomerCredit,
  WebBillingInvoice,
} from '../types';
import { WebFamilies } from './WebFamilies';

interface WebStudentsProps {
  students: WebStudent[];
  groups: WebGroup[];
  families?: WebFamily[];
  charges?: WebCharge[];
  payments?: WebPayment[];
  customerCredits?: WebCustomerCredit[];
  invoices?: WebBillingInvoice[];
  onAddFamily?: (newFamily: WebFamily) => void;
  onUpdateFamily?: (updatedFamily: WebFamily) => void;
  onAddStudent: (newStudent: WebStudent) => void;
  onQuickPay: (student: WebStudent) => void;
  onQuickPayFamily?: (family: WebFamily) => void;
  subscription?: SubscriptionStatusInfo;
  onOpenPlansModal?: () => void;
}

export const WebStudents: React.FC<WebStudentsProps> = ({
  students,
  groups,
  families = [],
  charges = [],
  payments = [],
  customerCredits = [],
  invoices = [],
  onAddFamily,
  onUpdateFamily,
  onAddStudent,
  onQuickPay,
  onQuickPayFamily,
  subscription,
  onOpenPlansModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'STUDENTS' | 'FAMILIES'>('STUDENTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SCHOLARSHIP' | 'TRIAL' | 'DEBT'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<WebStudent | null>(null);
  const [planLimitWarning, setPlanLimitWarning] = useState<string | null>(null);

  const isStudentLimitReached =
    subscription?.limits?.students !== null &&
    subscription?.limits?.students !== undefined &&
    students.length >= subscription.limits.students;

  const handleOpenNewStudent = () => {
    if (isStudentLimitReached) {
      setPlanLimitWarning(
        `Has alcanzado el límite de alumnos de tu plan gratuito (${subscription.limits.students} alumnos activos). Actualiza a Pro para registrar alumnos ilimitados.`,
      );
      if (onOpenPlansModal) {
        onOpenPlansModal();
      }
      return;
    }
    setPlanLimitWarning(null);
    setShowModal(true);
  };

  // Form State for new student with Scholarship support
  const [formData, setFormData] = useState({
    name: '',
    familyName: '',
    contactName: '',
    phone: '',
    email: '',
    documentNumber: '',
    documentType: 'DNI' as 'DNI' | 'CE' | 'PASAPORTE',
    birthDate: '2015-05-10',
    sport: 'Fútbol Formativo',
    groupName: groups[0]?.name || 'Sub-10 A (Cancha 1)',
    monthlyFee: 180.0,
    scholarshipType: 'NONE' as ScholarshipType,
    scholarshipDiscountPct: 0,
    scholarshipFixedDiscount: 0,
    scholarshipReason: '',
    scholarshipApprovedBy: 'Dirección Deportiva',
    emergencyPhone: '',
    medicalNotes: '',
  });

  const calculateEffectiveFee = (
    baseFee: number,
    type: ScholarshipType,
    pct: number,
    fixed: number
  ): number => {
    if (type === 'FULL_SCHOLARSHIP') return 0;
    if (type === 'HALF_SCHOLARSHIP') return Math.max(0, baseFee * 0.5);
    if (type === 'SIBLING_DISCOUNT') return Math.max(0, baseFee * (1 - (pct || 15) / 100));
    if (type === 'CUSTOM_DISCOUNT') {
      if (fixed > 0) return Math.max(0, baseFee - fixed);
      if (pct > 0) return Math.max(0, baseFee * (1 - pct / 100));
    }
    return baseFee;
  };

  const previewEffectiveFee = calculateEffectiveFee(
    Number(formData.monthlyFee) || 0,
    formData.scholarshipType,
    Number(formData.scholarshipDiscountPct) || 0,
    Number(formData.scholarshipFixedDiscount) || 0
  );

  const previewDiscountAmount = (Number(formData.monthlyFee) || 0) - previewEffectiveFee;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.documentNumber.includes(searchTerm) ||
      s.familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.scholarshipReason && s.scholarshipReason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSport = selectedSport === 'ALL' || s.sport === selectedSport;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.status === 'ACTIVE' && (!s.scholarshipType || s.scholarshipType === 'NONE')) ||
      (statusFilter === 'SCHOLARSHIP' && s.scholarshipType && s.scholarshipType !== 'NONE') ||
      (statusFilter === 'TRIAL' && s.status === 'TRIAL') ||
      (statusFilter === 'DEBT' && s.balance > 0);

    return matchesSearch && matchesSport && matchesStatus;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.documentNumber) return;

    const baseFee = Number(formData.monthlyFee) || 180;
    const finalFee = calculateEffectiveFee(
      baseFee,
      formData.scholarshipType,
      Number(formData.scholarshipDiscountPct) || 0,
      Number(formData.scholarshipFixedDiscount) || 0
    );

    const newStudent: WebStudent = {
      id: `stu-${Date.now()}`,
      academyId: 'acad-alianza-01',
      name: formData.name,
      familyId: `fam-${Date.now()}`,
      familyName: formData.familyName || `Familia ${formData.name.split(' ').slice(-1)[0]}`,
      contactName: formData.contactName || 'Apoderado Titular',
      phone: formData.phone || '+51 900 000 000',
      email: formData.email || 'apoderado@gmail.com',
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      birthDate: formData.birthDate,
      age: 10,
      sport: formData.sport,
      groupName: formData.groupName,
      status: 'ACTIVE',
      monthlyFee: baseFee,
      scholarshipType: formData.scholarshipType,
      scholarshipDiscountPct:
        formData.scholarshipType === 'FULL_SCHOLARSHIP'
          ? 100
          : formData.scholarshipType === 'HALF_SCHOLARSHIP'
          ? 50
          : formData.scholarshipType === 'SIBLING_DISCOUNT'
          ? Number(formData.scholarshipDiscountPct) || 15
          : Number(formData.scholarshipDiscountPct) || 0,
      scholarshipFixedDiscount: Number(formData.scholarshipFixedDiscount) || 0,
      scholarshipReason: formData.scholarshipReason || undefined,
      scholarshipApprovedBy:
        formData.scholarshipType !== 'NONE' ? formData.scholarshipApprovedBy : undefined,
      finalMonthlyFee: finalFee,
      balance: finalFee === 0 ? 0.0 : finalFee, // If 100% scholarship, zero debt!
      emergencyPhone: formData.emergencyPhone || formData.phone,
      medicalNotes: formData.medicalNotes || 'Apto médico regular sin alergias.',
      attendanceRate: 100,
    };

    onAddStudent(newStudent);
    setShowModal(false);
    // Reset form
    setFormData({
      name: '',
      familyName: '',
      contactName: '',
      phone: '',
      email: '',
      documentNumber: '',
      documentType: 'DNI',
      birthDate: '2015-05-10',
      sport: 'Fútbol Formativo',
      groupName: groups[0]?.name || 'Sub-10 A (Cancha 1)',
      monthlyFee: 180.0,
      scholarshipType: 'NONE',
      scholarshipDiscountPct: 0,
      scholarshipFixedDiscount: 0,
      scholarshipReason: '',
      scholarshipApprovedBy: 'Dirección Deportiva',
      emergencyPhone: '',
      medicalNotes: '',
    });
  };

  const getScholarshipBadge = (student: WebStudent) => {
    switch (student.scholarshipType) {
      case 'FULL_SCHOLARSHIP':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-500/15 text-purple-300 border border-purple-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">
            <Award className="w-2.5 h-2.5 text-purple-400 shrink-0" />
            Beca 100% Exonerado
          </span>
        );
      case 'HALF_SCHOLARSHIP':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">
            <Percent className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            Semibeca 50%
          </span>
        );
      case 'SIBLING_DISCOUNT':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-500/15 text-sky-300 border border-sky-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">
            <Tag className="w-2.5 h-2.5 text-sky-400 shrink-0" />
            Desc. Hermano (-{student.scholarshipDiscountPct || 15}%)
          </span>
        );
      case 'CUSTOM_DISCOUNT':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">
            <Tag className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            {student.scholarshipFixedDiscount
              ? `-S/ ${student.scholarshipFixedDiscount.toFixed(2)}`
              : `-${student.scholarshipDiscountPct || 20}%`}{' '}
            Convenio
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header and Controls */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <h1 className="text-base font-bold text-white uppercase tracking-wide">
              Directorio de Alumnos y Familias ({students.length})
            </h1>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Control de matrículas, historial de asistencia, datos de contacto de apoderados y estado de pensiones.
          </p>
        </div>

        <button
          onClick={handleOpenNewStudent}
          className={`px-3.5 py-2 rounded font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 transition shadow-sm ${
            isStudentLimitReached
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : 'bg-sky-500 hover:bg-sky-400 text-black'
          }`}
        >
          {isStudentLimitReached ? <Zap className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
          <span>{isStudentLimitReached ? 'Límite de Alumnos (Actualizar a Pro)' : 'Inscribir Nuevo Alumno'}</span>
        </button>
      </div>

      {/* Sub-Navigation: Alumnos vs Familias */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveSubTab('STUDENTS')}
          className={`px-3 py-2 rounded-t font-bold flex items-center gap-2 transition cursor-pointer text-xs ${
            activeSubTab === 'STUDENTS'
              ? 'bg-[#161B22] text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Alumnos Matriculados ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('FAMILIES')}
          className={`px-3 py-2 rounded-t font-bold flex items-center gap-2 transition cursor-pointer text-xs ${
            activeSubTab === 'FAMILIES'
              ? 'bg-[#161B22] text-purple-300 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Familias & Apoderados ({families.length})</span>
          <span className="text-[9px] bg-purple-950/70 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-bold">
            Estado de Cuenta Consolidado
          </span>
        </button>
      </div>

      {activeSubTab === 'FAMILIES' ? (
        <WebFamilies
          families={families}
          students={students}
          groups={groups}
          charges={charges}
          payments={payments}
          customerCredits={customerCredits}
          invoices={invoices}
          onAddFamily={onAddFamily || (() => {})}
          onUpdateFamily={onUpdateFamily || (() => {})}
          onAddStudent={onAddStudent}
          onGoToCashierForStudent={(studentId) => {
            const s = students.find((st) => st.id === studentId);
            if (s) onQuickPay(s);
          }}
          onGoToCashierForFamily={onQuickPayFamily}
        />
      ) : (
        <>

      {/* Plan Limit Warning Banner if at capacity */}
      {isStudentLimitReached && (
        <div className="bg-amber-950/60 border border-amber-500/40 rounded p-3 text-xs font-mono text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Has alcanzado el límite de {subscription?.limits.students || 30} alumnos de tu plan gratuito ({students.length} activos).
              Tus alumnos existentes siguen 100% operativos.
            </span>
          </div>
          <button
            onClick={onOpenPlansModal}
            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded text-[11px] transition whitespace-nowrap"
          >
            Actualizar a PRO
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por alumno, DNI o familia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161B22] border border-slate-800 rounded pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 text-[10px] uppercase">Filtro:</span>
          {[
            { id: 'ALL', label: `Todos (${students.length})` },
            {
              id: 'ACTIVE',
              label: `Regulares (${
                students.filter(
                  (s) => s.status === 'ACTIVE' && (!s.scholarshipType || s.scholarshipType === 'NONE')
                ).length
              })`,
            },
            {
              id: 'SCHOLARSHIP',
              label: `Becas / Subsidios (${
                students.filter((s) => s.scholarshipType && s.scholarshipType !== 'NONE').length
              })`,
              badge: true,
            },
            {
              id: 'DEBT',
              label: `Con Deuda (${students.filter((s) => s.balance > 0).length})`,
            },
            {
              id: 'TRIAL',
              label: `Clase Prueba (${students.filter((s) => s.status === 'TRIAL').length})`,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id as any)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition flex items-center gap-1.5 ${
                statusFilter === item.id
                  ? item.id === 'SCHOLARSHIP'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-sky-500 text-black shadow-sm'
                  : 'bg-[#161B22] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.badge && <Award className="w-3 h-3 text-purple-300" />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Student List Table */}
      <div className="bg-[#0F1219] border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#161B22] text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="p-3">Alumno & Documento</th>
                <th className="p-3">Categoría / Deporte</th>
                <th className="p-3">Familia / Apoderado</th>
                <th className="p-3">Asistencia</th>
                <th className="p-3">Condición / Pensión</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.map((student) => {
                const hasScholarship =
                  student.scholarshipType && student.scholarshipType !== 'NONE';
                const effectiveFee =
                  student.finalMonthlyFee !== undefined
                    ? student.finalMonthlyFee
                    : student.scholarshipType === 'FULL_SCHOLARSHIP'
                    ? 0
                    : student.scholarshipType === 'HALF_SCHOLARSHIP'
                    ? student.monthlyFee * 0.5
                    : student.monthlyFee;

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-800/30 transition text-slate-300"
                  >
                    <td className="p-3">
                      <div className="font-bold text-white text-xs flex items-center gap-2 flex-wrap">
                        <span>{student.name}</span>
                        {student.status === 'TRIAL' && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold">
                            TRIAL
                          </span>
                        )}
                        {hasScholarship && getScholarshipBadge(student)}
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        {student.documentType}: {student.documentNumber} • {student.age} años
                      </div>
                      {hasScholarship && student.scholarshipReason && (
                        <div className="text-[9px] text-purple-400/90 mt-0.5 italic flex items-center gap-1">
                          <span>Motivo: {student.scholarshipReason}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="text-sky-400 font-semibold">{student.groupName}</div>
                      <div className="text-slate-500 text-[10px]">{student.sport}</div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-200">{student.contactName}</span>
                        {student.familyName && (
                          <button
                            onClick={() => setActiveSubTab('FAMILIES')}
                            className="text-[9px] bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono cursor-pointer transition"
                            title="Ver en Directorio de Familias"
                          >
                            {student.familyName}
                          </button>
                        )}
                      </div>
                      <div className="text-slate-400 text-[10px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5 text-slate-500" />
                        <span>{student.phone}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${student.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-emerald-400 text-[10px]">
                          {student.attendanceRate}%
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500">Puntualidad regular</div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        {hasScholarship && (
                          <span className="line-through text-slate-500 text-[10px]">
                            S/ {student.monthlyFee.toFixed(2)}
                          </span>
                        )}
                        <span
                          className={`font-bold ${
                            student.scholarshipType === 'FULL_SCHOLARSHIP'
                              ? 'text-purple-300'
                              : hasScholarship
                              ? 'text-emerald-400'
                              : 'text-white'
                          }`}
                        >
                          S/ {effectiveFee.toFixed(2)}
                        </span>
                        <span className="text-slate-500 text-[10px] font-normal"> /mes</span>
                      </div>

                      <div className="mt-0.5">
                        {student.scholarshipType === 'FULL_SCHOLARSHIP' ? (
                          <span className="text-purple-300 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>100% Exonerado</span>
                          </span>
                        ) : student.balance > 0 ? (
                          <span className="text-amber-400 font-bold text-[10px]">
                            Deuda: S/ {student.balance.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Al día</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-2 py-1 rounded bg-[#161B22] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-bold"
                        >
                          Ficha
                        </button>

                        {student.balance > 0 && (
                          <button
                            onClick={() => onQuickPay(student)}
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Cobrar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Modal: Inscribir Alumno */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-800 rounded max-w-xl w-full p-4 shadow-2xl space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Formulario de Matrícula / Registro de Alumno
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Nombre Completo del Alumno *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rodrigo Quispe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">DNI del Alumno *</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="8 dígitos"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Opción de vincular a Familia existente */}
              {families.length > 0 && (
                <div>
                  <label className="text-[10px] text-purple-300 font-bold block mb-1">
                    Vincular a Núcleo Familiar Existente (Aplica Descuento Hermanos)
                  </label>
                  <select
                    value={formData.familyName}
                    onChange={(e) => {
                      const selectedFam = families.find((f) => f.name === e.target.value);
                      if (selectedFam) {
                        const prim = selectedFam.contacts.find((c) => c.isPrimary) || selectedFam.contacts[0];
                        setFormData({
                          ...formData,
                          familyName: selectedFam.name,
                          contactName: prim ? `${prim.fullName} (${prim.relationship})` : '',
                          phone: prim?.phone || '',
                          email: prim?.email || '',
                          emergencyPhone: prim?.phone || '',
                          scholarshipType: 'SIBLING_DISCOUNT',
                          scholarshipDiscountPct: 15,
                          scholarshipReason: `Hermano en ${selectedFam.name} (-15%)`,
                        });
                      } else {
                        setFormData({
                          ...formData,
                          familyName: e.target.value,
                        });
                      }
                    }}
                    className="w-full bg-[#161B22] border border-purple-500/40 rounded px-2.5 py-1.5 text-white text-xs"
                  >
                    <option value="">-- Registrar Familia Nueva / Independiente --</option>
                    {families.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.code} - {f.name} ({f.contacts[0]?.fullName || 'Sin contacto'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Apoderado / Madre / Padre</label>
                  <input
                    type="text"
                    placeholder="Nombre del apoderado"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Teléfono Móvil (WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="+51 9..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Categoría / Grupo</label>
                  <select
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name} ({g.sport})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Tarifa Base de Lista (PEN)</label>
                  <input
                    type="number"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                    className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white font-bold"
                  />
                </div>
              </div>

              {/* SECCIÓN DE BECAS, SEMIBECAS Y DESCUENTOS */}
              <div className="p-3 bg-[#131720] border border-purple-500/30 rounded space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                      Condición Arancelaria, Becas y Beneficios
                    </span>
                  </div>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">
                    POLÍTICA FORMATIVA
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Tipo de Beca / Descuento
                    </label>
                    <select
                      value={formData.scholarshipType}
                      onChange={(e) => {
                        const type = e.target.value as ScholarshipType;
                        let pct = 0;
                        if (type === 'FULL_SCHOLARSHIP') pct = 100;
                        if (type === 'HALF_SCHOLARSHIP') pct = 50;
                        if (type === 'SIBLING_DISCOUNT') pct = 15;
                        setFormData({
                          ...formData,
                          scholarshipType: type,
                          scholarshipDiscountPct: pct,
                          scholarshipFixedDiscount: type === 'CUSTOM_DISCOUNT' ? 40 : 0,
                        });
                      }}
                      className="w-full bg-[#161B22] border border-purple-500/40 rounded px-2 py-1.5 text-white font-bold text-xs"
                    >
                      <option value="NONE">Sin Beca (Tarifa Regular 100%)</option>
                      <option value="FULL_SCHOLARSHIP">Beca Integral 100% (Exonerado - S/ 0)</option>
                      <option value="HALF_SCHOLARSHIP">Semibeca 50% (Socioeconómica / Talento)</option>
                      <option value="SIBLING_DISCOUNT">Descuento de Hermanos (-15%)</option>
                      <option value="CUSTOM_DISCOUNT">Descuento Personalizado / Convenio</option>
                    </select>
                  </div>

                  {formData.scholarshipType === 'CUSTOM_DISCOUNT' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Desc. Fijo (S/)</label>
                        <input
                          type="number"
                          placeholder="Ej. 40.00"
                          value={formData.scholarshipFixedDiscount || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              scholarshipFixedDiscount: Number(e.target.value),
                              scholarshipDiscountPct: 0,
                            })
                          }
                          className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-emerald-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">O en Porcentaje (%)</label>
                        <input
                          type="number"
                          placeholder="Ej. 25%"
                          value={formData.scholarshipDiscountPct || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              scholarshipDiscountPct: Number(e.target.value),
                              scholarshipFixedDiscount: 0,
                            })
                          }
                          className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-emerald-400 font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {formData.scholarshipType === 'SIBLING_DISCOUNT' && (
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Porcentaje de Descuento</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.scholarshipDiscountPct}
                          onChange={(e) =>
                            setFormData({ ...formData, scholarshipDiscountPct: Number(e.target.value) })
                          }
                          className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-sky-400 font-bold"
                        />
                        <span className="text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                  )}
                </div>

                {formData.scholarshipType !== 'NONE' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-purple-500/20">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Motivo / Justificación de la Beca *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Talento Selección Sub-10, Convenio Colegio, etc."
                        value={formData.scholarshipReason}
                        onChange={(e) => setFormData({ ...formData, scholarshipReason: e.target.value })}
                        className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Aprobado por / Comité
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Dirección Deportiva, Comité de Becas"
                        value={formData.scholarshipApprovedBy}
                        onChange={(e) =>
                          setFormData({ ...formData, scholarshipApprovedBy: e.target.value })
                        }
                        className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white text-[11px]"
                      />
                    </div>
                  </div>
                )}

                {/* Calculadora en tiempo real del arancel */}
                <div className="p-2 bg-[#161B22] rounded border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block text-[10px]">Cálculo arancelario mensual:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Base: S/ {Number(formData.monthlyFee || 0).toFixed(2)}</span>
                      {previewDiscountAmount > 0 && (
                        <span className="text-purple-400 font-semibold">
                          - Descuento: S/ {previewDiscountAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Cuota Neta Final:</span>
                    <span
                      className={`text-sm font-bold ${
                        formData.scholarshipType === 'FULL_SCHOLARSHIP'
                          ? 'text-purple-300'
                          : previewDiscountAmount > 0
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {formData.scholarshipType === 'FULL_SCHOLARSHIP'
                        ? 'S/ 0.00 (Exonerado)'
                        : `S/ ${previewEffectiveFee.toFixed(2)}/mes`}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Ficha Médica / Alergias / Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Alergias, asma, grupo sanguíneo o recomendaciones..."
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1.5 text-white text-[11px]"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs"
                >
                  Guardar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ficha Detallada del Alumno */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-800 rounded max-w-lg w-full p-4 shadow-2xl space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                    FICHA INTEGRAL DEL ALUMNO
                  </span>
                  {selectedStudent.scholarshipType &&
                    selectedStudent.scholarshipType !== 'NONE' &&
                    getScholarshipBadge(selectedStudent)}
                </div>
                <h3 className="font-bold text-white text-sm mt-1">
                  {selectedStudent.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-2 bg-[#161B22] rounded border border-slate-800">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Documento</span>
                  <span className="text-white font-bold">{selectedStudent.documentType}: {selectedStudent.documentNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Categoría</span>
                  <span className="text-sky-400 font-bold">{selectedStudent.groupName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Apoderado</span>
                  <span className="text-slate-300">{selectedStudent.contactName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Teléfono Contacto</span>
                  <span className="text-slate-300">{selectedStudent.phone}</span>
                </div>
              </div>

              {/* CARD DE BECA Y CONDICIÓN FORMATIVA */}
              {selectedStudent.scholarshipType && selectedStudent.scholarshipType !== 'NONE' && (
                <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px] uppercase">
                      <Award className="w-3.5 h-3.5 text-purple-400" />
                      <span>Condición de Beca / Subsidio Deportivo</span>
                    </div>
                    {getScholarshipBadge(selectedStudent)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Tarifa regular de lista:</span>
                      <span className="line-through text-slate-500">
                        S/ {selectedStudent.monthlyFee.toFixed(2)}/mes
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Cuota mensual con beca:</span>
                      <span className="text-emerald-400 font-bold">
                        {selectedStudent.scholarshipType === 'FULL_SCHOLARSHIP'
                          ? 'S/ 0.00 (Exonerado 100%)'
                          : `S/ ${(
                              selectedStudent.finalMonthlyFee ?? selectedStudent.monthlyFee
                            ).toFixed(2)}/mes`}
                      </span>
                    </div>
                  </div>

                  {selectedStudent.scholarshipReason && (
                    <div className="p-2 bg-[#161B22] rounded border border-purple-500/20 text-[11px]">
                      <span className="text-[10px] text-slate-400 block uppercase">Motivo / Dictamen:</span>
                      <span className="text-purple-200">{selectedStudent.scholarshipReason}</span>
                    </div>
                  )}

                  {selectedStudent.scholarshipApprovedBy && (
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Aprobado por: <strong className="text-slate-200">{selectedStudent.scholarshipApprovedBy}</strong></span>
                      <span className="text-purple-300">
                        Ahorro anual familia: S/{' '}
                        {(
                          (selectedStudent.monthlyFee -
                            (selectedStudent.finalMonthlyFee ?? selectedStudent.monthlyFee)) *
                          10
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-2.5 bg-[#161B22] rounded border border-slate-800 space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-rose-400 uppercase font-bold">
                  <HeartPulse className="w-3 h-3" />
                  <span>Ficha Médica y Salud</span>
                </div>
                <div className="text-slate-300 text-[11px]">
                  {selectedStudent.medicalNotes || 'Sin observaciones médicas especiales.'}
                </div>
                <div className="text-slate-500 text-[10px]">
                  Emergencias: {selectedStudent.emergencyPhone}
                </div>
              </div>

              <div className="p-2.5 bg-[#161B22] rounded border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Estado de Cobranza</span>
                  <span className="font-bold text-white">
                    Pensión efectiva: S/{' '}
                    {(selectedStudent.finalMonthlyFee ?? selectedStudent.monthlyFee).toFixed(2)}/mes
                  </span>
                </div>
                <div>
                  {selectedStudent.scholarshipType === 'FULL_SCHOLARSHIP' ? (
                    <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-1 rounded font-bold">
                      100% Exonerado (Beca)
                    </span>
                  ) : selectedStudent.balance > 0 ? (
                    <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded font-bold">
                      Deuda: S/ {selectedStudent.balance.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded font-bold">
                      Al Día (0 Deuda)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 rounded bg-slate-800 text-white font-bold text-xs"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
