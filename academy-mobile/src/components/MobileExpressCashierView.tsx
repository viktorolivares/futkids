import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Share2,
  MessageCircle,
  Copy,
  Check,
  Search,
  ArrowRight,
  Receipt,
  User,
  Sparkles,
} from 'lucide-react';
import { MobileStudent, MobileAcademyProfile, MobilePaymentRecord } from '../types';

interface MobileExpressCashierViewProps {
  students: MobileStudent[];
  academy: MobileAcademyProfile;
  preselectedStudent?: MobileStudent | null;
  onRegisterPayment: (payment: MobilePaymentRecord) => void;
  recentPayments: MobilePaymentRecord[];
}

export const MobileExpressCashierView: React.FC<MobileExpressCashierViewProps> = ({
  students,
  academy,
  preselectedStudent,
  onRegisterPayment,
  recentPayments,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent ? preselectedStudent.id : students[0]?.id || ''
  );
  const [amount, setAmount] = useState<string>(
    preselectedStudent && preselectedStudent.balance > 0
      ? preselectedStudent.balance.toString()
      : '180.00'
  );
  const [method, setMethod] = useState<'YAPE' | 'PLIN' | 'CASH' | 'CARD' | 'TRANSFER'>('YAPE');
  const [refNumber, setRefNumber] = useState('');
  const [concept, setConcept] = useState('Cuota Mensual Deportiva Septiembre');
  const [lastIssuedPayment, setLastIssuedPayment] = useState<MobilePaymentRecord | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Update when preselectedStudent changes
  useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudentId(preselectedStudent.id);
      if (preselectedStudent.balance > 0) {
        setAmount(preselectedStudent.balance.toString());
      }
    }
  }, [preselectedStudent]);

  const activeStudent = students.find((s) => s.id === selectedStudentId);

  // When student selection changes, suggest amount based on their debt
  const handleSelectStudent = (stuId: string) => {
    setSelectedStudentId(stuId);
    const stu = students.find((s) => s.id === stuId);
    if (stu && stu.balance > 0) {
      setAmount(stu.balance.toFixed(2));
    } else {
      setAmount('180.00');
    }
  };

  const handleProcessPayment = () => {
    if (!activeStudent) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }

    const randomReceiptNum = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const timestampStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    const newPayment: MobilePaymentRecord = {
      id: `pay_${Date.now()}`,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      parentName: activeStudent.parentName,
      parentPhone: activeStudent.parentPhone,
      amount: numAmount,
      paymentMethod: method,
      referenceNumber: refNumber || `OP-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: timestampStr,
      concept,
      receiptNumber: randomReceiptNum,
      discountedBalance: Math.max(0, activeStudent.balance - numAmount),
    };

    onRegisterPayment(newPayment);
    setLastIssuedPayment(newPayment);
    setRefNumber('');
  };

  const generateReceiptWhatsAppText = (p: MobilePaymentRecord) => {
    return (
      `🧾 *CONSTANCIA DE PAGO DIGITAL — ${academy.name}*\n` +
      `----------------------------------------\n` +
      `📄 *Recibo Nº:* ${p.receiptNumber}\n` +
      `⚽ *Alumno:* ${p.studentName}\n` +
      `👤 *Apoderado:* ${p.parentName}\n` +
      `💵 *Monto Abonado:* S/ ${p.amount.toFixed(2)}\n` +
      `💳 *Medio de Pago:* ${p.paymentMethod} (Ref: ${p.referenceNumber})\n` +
      `📌 *Concepto:* ${p.concept}\n` +
      `📅 *Fecha y Hora:* ${p.timestamp}\n` +
      `----------------------------------------\n` +
      `📊 *Nuevo Saldo:* S/ ${p.discountedBalance.toFixed(2)} ${p.discountedBalance === 0 ? '🟢 (AL DÍA)' : '🟡 (SALDO RESTANTE)'}\n\n` +
      `¡Muchas gracias por su puntualidad y respaldo a la formación deportiva!`
    );
  };

  const shareReceiptWhatsApp = (p: MobilePaymentRecord) => {
    const text = encodeURIComponent(generateReceiptWhatsAppText(p));
    window.open(`https://wa.me/${p.parentPhone}?text=${text}`, '_blank');
  };

  const copyReceiptText = (p: MobilePaymentRecord) => {
    navigator.clipboard.writeText(generateReceiptWhatsAppText(p));
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="space-y-3 pb-20 font-mono text-xs">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase">
                Caja Rápida de Campo (Express POS)
              </h2>
              <p className="text-[11px] text-slate-400">
                Registro de Yape / Plin / Efectivo en 3 toques con envío de recibo.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-emerald-400 block font-bold uppercase">Yape Academia:</span>
            <span className="text-xs font-bold text-white">{academy.yapeNumber}</span>
          </div>
        </div>
      </div>

      {/* Payment Form Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-md">
        {/* Student Selector */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
            Seleccionar Alumno que Paga:
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => handleSelectStudent(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name} • {s.balance > 0 ? `Debe: S/ ${s.balance.toFixed(2)}` : 'AL DÍA (S/ 0.00)'} • Apod: {s.parentName}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Student Current Balance Card */}
        {activeStudent && (
          <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase">Apoderado Responsable:</span>
              <span className="font-bold text-white text-xs">{activeStudent.parentName}</span>
              <span className="text-[10px] text-sky-400 block">WhatsApp: {activeStudent.parentPhone}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-500 block uppercase">Saldo Actual:</span>
              <span
                className={`font-black text-sm ${
                  activeStudent.balance === 0
                    ? 'text-emerald-400'
                    : activeStudent.debtSeverity === 'CURRENT_DUE'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                S/ {activeStudent.balance.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Amount Input and Quick Preset Buttons */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
            Monto a Cobrar (PEN S/):
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm font-bold text-emerald-400">S/</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-black focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[
              { label: 'S/ 50', val: '50.00' },
              { label: 'S/ 100', val: '100.00' },
              { label: 'S/ 180 (Mes)', val: '180.00' },
              {
                label: activeStudent && activeStudent.balance > 0 ? `Total (S/ ${activeStudent.balance})` : 'S/ 360',
                val: activeStudent && activeStudent.balance > 0 ? activeStudent.balance.toFixed(2) : '360.00',
              },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setAmount(preset.val)}
                className="py-1 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition text-center cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
            Medio de Pago:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'YAPE' as const, label: '🟣 Yape', color: 'bg-purple-950/60 border-purple-500 text-purple-300' },
              { id: 'PLIN' as const, label: '🔵 Plin', color: 'bg-sky-950/60 border-sky-500 text-sky-300' },
              { id: 'CASH' as const, label: '💵 Efectivo', color: 'bg-emerald-950/60 border-emerald-500 text-emerald-300' },
              { id: 'CARD' as const, label: '💳 Tarjeta POS', color: 'bg-amber-950/60 border-amber-500 text-amber-300' },
              { id: 'TRANSFER' as const, label: '🏦 Transferencia', color: 'bg-indigo-950/60 border-indigo-500 text-indigo-300' },
            ].map((m) => {
              const isSelected = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`p-2 rounded-lg border text-[11px] font-bold transition cursor-pointer text-center ${
                    isSelected ? `${m.color} shadow-sm font-black` : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reference Number (4 digits of Yape) */}
        {(method === 'YAPE' || method === 'PLIN' || method === 'CARD' || method === 'TRANSFER') && (
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Código de Operación / 4 últimos dígitos de Yape:
            </label>
            <input
              type="text"
              placeholder="Ej. 8492 o Nro de Operación"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Big Action Button */}
        <button
          type="button"
          onClick={handleProcessPayment}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
        >
          <Receipt className="w-4 h-4" />
          <span>Registrar Cobro Express de S/ {parseFloat(amount || '0').toFixed(2)}</span>
        </button>
      </div>

      {/* Instant Digital Receipt Modal after payment */}
      {lastIssuedPayment && (
        <div className="p-3.5 bg-slate-950 border-2 border-emerald-500 rounded-xl space-y-2.5 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ¡Cobro Registrado Satisfactoriamente!
            </span>
            <button
              onClick={() => setLastIssuedPayment(null)}
              className="text-slate-400 hover:text-white font-bold text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-[11px] space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Recibo:</span>
              <strong className="text-white">{lastIssuedPayment.receiptNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Alumno:</span>
              <strong className="text-white">{lastIssuedPayment.studentName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Monto Cobrado:</span>
              <strong className="text-emerald-400 text-xs">S/ {lastIssuedPayment.amount.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Medio:</span>
              <span className="text-sky-400">{lastIssuedPayment.paymentMethod} ({lastIssuedPayment.referenceNumber})</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-500">Nuevo Saldo:</span>
              <strong className={lastIssuedPayment.discountedBalance === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                S/ {lastIssuedPayment.discountedBalance.toFixed(2)} {lastIssuedPayment.discountedBalance === 0 ? '(AL DÍA)' : ''}
              </strong>
            </div>
          </div>

          {/* Action Buttons to Share */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shareReceiptWhatsApp(lastIssuedPayment)}
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Recibo por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => copyReceiptText(lastIssuedPayment)}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition cursor-pointer"
            >
              {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReceipt ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Field Payments List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-bold">
            Cobros Registrados Hoy en Cancha ({recentPayments.length})
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">
            Total: S/ {recentPayments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}
          </span>
        </div>

        {recentPayments.length === 0 ? (
          <div className="text-center py-3 text-slate-500 text-[11px]">
            Aún no se han registrado cobros en el turno de hoy.
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentPayments.map((p) => (
              <div
                key={p.id}
                className="p-2 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between text-[11px]"
              >
                <div>
                  <div className="font-bold text-white">{p.studentName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {p.paymentMethod} • Ref: {p.referenceNumber} • {p.timestamp.split(' ')[1]}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-400 font-mono">
                    S/ {p.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => shareReceiptWhatsApp(p)}
                    className="p-1 rounded bg-slate-800 text-emerald-400 hover:text-white"
                    title="Reenviar recibo por WhatsApp"
                  >
                    <MessageCircle className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default MobileExpressCashierView;
