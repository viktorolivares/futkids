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
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
            <Award className="w-3 h-3 text-purple-600 shrink-0" />
            Beca 100%
          </span>
        );
      case 'HALF_SCHOLARSHIP':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
            <Percent className="w-3 h-3 text-amber-600 shrink-0" />
            Semibeca 50%
          </span>
        );
      case 'SIBLING_DISCOUNT':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
            <Tag className="w-3 h-3 text-blue-600 shrink-0" />
            Hermano (-{student.scholarshipDiscountPct || 15}%)
          </span>
        );
      case 'CUSTOM_DISCOUNT':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
            <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header and Controls */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Alumnos y Familias ({students.length})
            </h1>
          </div>
          <p className="text-slate-500 text-sm max-w-2xl">
            Gestión integral de matrículas, fichas de contacto, asistencia regular y estado de cuotas.
          </p>
        </div>

        <button
          onClick={handleOpenNewStudent}
          className={`px-5 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 transition cursor-pointer shadow-xs ${
            isStudentLimitReached
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isStudentLimitReached ? <Zap className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isStudentLimitReached ? 'Límite (Ver Planes)' : 'Inscribir Nuevo Alumno'}</span>
        </button>
      </div>

      {/* Sub-Navigation: Alumnos vs Familias */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('STUDENTS')}
          className={`px-5 py-3 font-semibold flex items-center gap-2 transition cursor-pointer text-sm border-b-2 -mb-px ${
            activeSubTab === 'STUDENTS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Alumnos Matriculados ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('FAMILIES')}
          className={`px-5 py-3 font-semibold flex items-center gap-2 transition cursor-pointer text-sm border-b-2 -mb-px ${
            activeSubTab === 'FAMILIES'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Familias y Apoderados ({families.length})</span>
          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
            Consolidado
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
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Has alcanzado el límite de {subscription?.limits.students || 30} alumnos de tu plan gratuito ({students.length} activos).
                  Tus alumnos existentes siguen 100% operativos.
                </span>
              </div>
              <button
                onClick={onOpenPlansModal}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition whitespace-nowrap cursor-pointer"
              >
                Actualizar a Pro
              </button>
            </div>
          )}

          {/* Filter and Search Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por alumno, DNI o familia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-slate-800 placeholder-slate-400 text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Quick Category Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 text-xs font-semibold uppercase">Filtrar:</span>
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
                  label: `Becas (${
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
                  label: `Prueba (${students.filter((s) => s.status === 'TRIAL').length})`,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStatusFilter(item.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === item.id
                      ? item.id === 'SCHOLARSHIP'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.badge && <Award className="w-3 h-3 text-purple-200" />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Student List Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4 pl-6">Alumno y Documento</th>
                    <th className="p-4">Categoría / Deporte</th>
                    <th className="p-4">Familia / Contacto</th>
                    <th className="p-4">Asistencia</th>
                    <th className="p-4">Pensión / Saldo</th>
                    <th className="p-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
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
                        className="hover:bg-slate-50/80 transition text-slate-700"
                      >
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                            <span>{student.name}</span>
                            {student.status === 'TRIAL' && (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                                Prueba
                              </span>
                            )}
                            {hasScholarship && getScholarshipBadge(student)}
                          </div>
                          <div className="text-slate-400 text-xs mt-0.5">
                            {student.documentType}: {student.documentNumber} • {student.age} años
                          </div>
                          {hasScholarship && student.scholarshipReason && (
                            <div className="text-xs text-purple-700 mt-0.5 italic">
                              Motivo: {student.scholarshipReason}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{student.groupName}</div>
                          <div className="text-slate-400 text-xs">{student.sport}</div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-800 font-medium">{student.contactName}</span>
                            {student.familyName && (
                              <button
                                onClick={() => setActiveSubTab('FAMILIES')}
                                className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-lg cursor-pointer transition font-medium"
                                title="Ver en Familias"
                              >
                                {student.familyName}
                              </button>
                            )}
                          </div>
                          <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{student.phone}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${student.attendanceRate}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-emerald-700 text-xs">
                              {student.attendanceRate}%
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">Asistencia regular</div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            {hasScholarship && (
                              <span className="line-through text-slate-400 text-xs">
                                S/ {student.monthlyFee.toFixed(2)}
                              </span>
                            )}
                            <span
                              className={`font-bold ${
                                student.scholarshipType === 'FULL_SCHOLARSHIP'
                                  ? 'text-purple-700'
                                  : hasScholarship
                                  ? 'text-emerald-700'
                                  : 'text-slate-900'
                              }`}
                            >
                              S/ {effectiveFee.toFixed(2)}
                            </span>
                            <span className="text-slate-400 text-xs font-normal"> /mes</span>
                          </div>

                          <div className="mt-0.5">
                            {student.scholarshipType === 'FULL_SCHOLARSHIP' ? (
                              <span className="text-purple-700 text-xs font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>100% Exonerado</span>
                              </span>
                            ) : student.balance > 0 ? (
                              <span className="text-amber-700 font-semibold text-xs">
                                Deuda: S/ {student.balance.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 text-xs flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Al día</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                            >
                              Ficha
                            </button>

                            {student.balance > 0 && (
                              <button
                                onClick={() => onQuickPay(student)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Matrícula y Registro de Alumno
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre Completo del Alumno *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rodrigo Quispe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">DNI del Alumno *</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="8 dígitos"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Opción de vincular a Familia existente */}
              {families.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-purple-800 block mb-1">
                    Vincular a Familia Existente (Aplica Descuento Hermanos)
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
                    className="w-full bg-purple-50/50 border border-purple-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:bg-white focus:border-purple-500 focus:outline-none transition"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Apoderado / Madre / Padre</label>
                  <input
                    type="text"
                    placeholder="Nombre del apoderado"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Teléfono Móvil (WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="+51 9..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Categoría / Grupo</label>
                  <select
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name} ({g.sport})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tarifa Base (PEN)</label>
                  <input
                    type="number"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-bold text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* SECCIÓN DE BECAS, SEMIBECAS Y DESCUENTOS */}
              <div className="p-4 bg-purple-50/50 border border-purple-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Condición Arancelaria y Becas
                    </span>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                    Formativa
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
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
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-slate-800 font-medium text-xs focus:outline-none focus:border-purple-500 transition"
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
                        <label className="text-xs font-medium text-slate-700 block mb-1">Desc. Fijo (S/)</label>
                        <input
                          type="number"
                          placeholder="40.00"
                          value={formData.scholarshipFixedDiscount || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              scholarshipFixedDiscount: Number(e.target.value),
                              scholarshipDiscountPct: 0,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-emerald-700 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">Porcentaje (%)</label>
                        <input
                          type="number"
                          placeholder="25"
                          value={formData.scholarshipDiscountPct || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              scholarshipDiscountPct: Number(e.target.value),
                              scholarshipFixedDiscount: 0,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-emerald-700 font-bold text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {formData.scholarshipType === 'SIBLING_DISCOUNT' && (
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">% de Descuento</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.scholarshipDiscountPct}
                          onChange={(e) =>
                            setFormData({ ...formData, scholarshipDiscountPct: Number(e.target.value) })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-blue-700 font-bold text-xs"
                        />
                        <span className="text-slate-500 font-bold">%</span>
                      </div>
                    </div>
                  )}
                </div>

                {formData.scholarshipType !== 'NONE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-purple-200/60">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Motivo de la Beca *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Talento Selección Sub-10"
                        value={formData.scholarshipReason}
                        onChange={(e) => setFormData({ ...formData, scholarshipReason: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Aprobado por
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Dirección Deportiva"
                        value={formData.scholarshipApprovedBy}
                        onChange={(e) =>
                          setFormData({ ...formData, scholarshipApprovedBy: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Calculadora de arancel */}
                <div className="p-3 bg-white rounded-xl border border-purple-200/70 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cálculo arancelario mensual:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-slate-600">Base: S/ {Number(formData.monthlyFee || 0).toFixed(2)}</span>
                      {previewDiscountAmount > 0 && (
                        <span className="text-purple-700 font-semibold">
                          - Descuento: S/ {previewDiscountAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Cuota Neta Final:</span>
                    <span
                      className={`text-base font-bold ${
                        formData.scholarshipType === 'FULL_SCHOLARSHIP'
                          ? 'text-purple-700'
                          : previewDiscountAmount > 0
                          ? 'text-emerald-700'
                          : 'text-slate-900'
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Ficha Médica / Alergias / Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Alergias, asma, grupo sanguíneo o recomendaciones..."
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold uppercase">
                    Ficha del Alumno
                  </span>
                  {selectedStudent.scholarshipType &&
                    selectedStudent.scholarshipType !== 'NONE' &&
                    getScholarshipBadge(selectedStudent)}
                </div>
                <h3 className="font-bold text-slate-900 text-xl">
                  {selectedStudent.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">Documento</span>
                  <span className="text-slate-900 font-bold">{selectedStudent.documentType}: {selectedStudent.documentNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">Categoría</span>
                  <span className="text-emerald-700 font-bold">{selectedStudent.groupName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">Apoderado</span>
                  <span className="text-slate-800">{selectedStudent.contactName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-medium">Teléfono Contacto</span>
                  <span className="text-slate-800">{selectedStudent.phone}</span>
                </div>
              </div>

              {/* CARD DE BECA Y CONDICIÓN FORMATIVA */}
              {selectedStudent.scholarshipType && selectedStudent.scholarshipType !== 'NONE' && (
                <div className="p-4 bg-purple-50/50 border border-purple-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs uppercase">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>Condición de Beca Deportiva</span>
                    </div>
                    {getScholarshipBadge(selectedStudent)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Tarifa regular de lista:</span>
                      <span className="line-through text-slate-400">
                        S/ {selectedStudent.monthlyFee.toFixed(2)}/mes
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Cuota con beneficio:</span>
                      <span className="text-emerald-700 font-bold text-sm">
                        {selectedStudent.scholarshipType === 'FULL_SCHOLARSHIP'
                          ? 'S/ 0.00 (Exonerado 100%)'
                          : `S/ ${(
                              selectedStudent.finalMonthlyFee ?? selectedStudent.monthlyFee
                            ).toFixed(2)}/mes`}
                      </span>
                    </div>
                  </div>

                  {selectedStudent.scholarshipReason && (
                    <div className="p-2.5 bg-white rounded-xl border border-purple-200 text-xs">
                      <span className="text-[11px] text-slate-400 block uppercase font-medium">Motivo:</span>
                      <span className="text-purple-900">{selectedStudent.scholarshipReason}</span>
                    </div>
                  )}

                  {selectedStudent.scholarshipApprovedBy && (
                    <div className="text-xs text-slate-500 flex items-center justify-between">
                      <span>Aprobado por: <strong className="text-slate-800">{selectedStudent.scholarshipApprovedBy}</strong></span>
                      <span className="text-purple-700 font-medium">
                        Ahorro anual: S/{' '}
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

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-rose-600 uppercase font-bold">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Ficha Médica y Salud</span>
                </div>
                <div className="text-slate-700 text-xs">
                  {selectedStudent.medicalNotes || 'Sin observaciones médicas especiales.'}
                </div>
                <div className="text-slate-500 text-xs">
                  Emergencias: {selectedStudent.emergencyPhone}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 uppercase block font-medium">Estado de Cobranza</span>
                  <span className="font-bold text-slate-900">
                    Pensión efectiva: S/{' '}
                    {(selectedStudent.finalMonthlyFee ?? selectedStudent.monthlyFee).toFixed(2)}/mes
                  </span>
                </div>
                <div>
                  {selectedStudent.scholarshipType === 'FULL_SCHOLARSHIP' ? (
                    <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded-full font-semibold">
                      100% Exonerado (Beca)
                    </span>
                  ) : selectedStudent.balance > 0 ? (
                    <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-semibold">
                      Deuda: S/ {selectedStudent.balance.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
                      Al Día (0 Deuda)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
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
