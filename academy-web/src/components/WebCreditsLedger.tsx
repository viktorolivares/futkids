import React, { useState } from 'react';
import {
  Coins,
  ArrowDownLeft,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Building,
  Smartphone,
  Check,
  RotateCcw,
} from 'lucide-react';
import { WebCustomerCredit, WebRefund, WebStudent } from '../types';

interface WebCreditsLedgerProps {
  customerCredits: WebCustomerCredit[];
  refunds: WebRefund[];
  students: WebStudent[];
  onAddCustomerCredit: (credit: WebCustomerCredit) => void;
}

export const WebCreditsLedger: React.FC<WebCreditsLedgerProps> = ({
  customerCredits,
  refunds,
  students,
  onAddCustomerCredit,
}) => {
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [creditAmount, setCreditAmount] = useState(40.0);
  const [creditReason, setCreditReason] = useState('Clase suspendida por mantenimiento de cancha');
  const [validityMonths, setValidityMonths] = useState(3);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const availableCredits = customerCredits.filter((c) => c.status === 'AVAILABLE' && c.remaining > 0);
  const totalAvailableAmount = availableCredits.reduce((acc, c) => acc + c.remaining, 0);
  const totalRefundedAmount = refunds.reduce((acc, r) => acc + r.amount, 0);

  const handleCreateCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
    const expiresAt = expiryDate.toISOString().split('T')[0];

    const newCredit: WebCustomerCredit = {
      id: `cred-${Date.now()}`,
      academyId: student.academyId,
      familyId: student.familyId,
      familyName: student.familyName,
      studentId: student.id,
      studentName: student.name,
      amount: creditAmount,
      remaining: creditAmount,
      reason: creditReason,
      expiresAt,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'AVAILABLE',
    };

    onAddCustomerCredit(newCredit);
    setShowAddCreditModal(false);
    setSuccessMsg(`Saldo a favor de S/ ${creditAmount.toFixed(2)} registrado para ${student.familyName}`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const filteredCredits = customerCredits.filter(
    (c) =>
      c.familyName.toLowerCase().includes(filterText.toLowerCase()) ||
      (c.studentName && c.studentName.toLowerCase().includes(filterText.toLowerCase())) ||
      c.reason.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Saldos a Favor Vigentes</span>
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            S/ {totalAvailableAmount.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {availableCredits.length} créditos disponibles para deducir en caja
          </div>
        </div>

        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Total en Devoluciones / Reembolsos</span>
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            S/ {totalRefundedAmount.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {refunds.length} devoluciones procesadas y auditadas
          </div>
        </div>

        <div className="bg-[#0F1219] border border-slate-800 rounded p-3.5 flex flex-col justify-between">
          <div className="text-slate-400 text-[10px] uppercase">
            Compensaciones Familiares
          </div>
          <button
            onClick={() => setShowAddCreditModal(true)}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Registrar Saldo a Favor</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded flex items-center gap-2 text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Tables Grid: Left Credits / Right Refunds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Customer Credits (7 cols) */}
        <div className="lg:col-span-7 bg-[#0F1219] border border-slate-800 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
            <span className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saldos a Favor de Familias ({customerCredits.length})</span>
            </span>

            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Buscar familia, motivo..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="bg-[#161B22] border border-slate-800 rounded pl-6 pr-2 py-1 text-[10px] text-slate-300 w-44"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredCredits.map((credit) => {
              const isAvailable = credit.status === 'AVAILABLE' && credit.remaining > 0;
              const usedPercentage = Math.round(((credit.amount - credit.remaining) / credit.amount) * 100);

              return (
                <div
                  key={credit.id}
                  className={`p-3 rounded border transition space-y-2 ${
                    isAvailable
                      ? 'bg-[#161B22] border-emerald-500/30'
                      : 'bg-[#161B22]/50 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {credit.familyName}
                        </span>
                        {credit.studentName && (
                          <span className="text-[10px] text-slate-400">
                            ({credit.studentName})
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            isAvailable
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isAvailable ? 'DISPONIBLE' : credit.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Motivo: <span className="text-slate-300">{credit.reason}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">
                        S/ {credit.remaining.toFixed(2)} disp.
                      </div>
                      <div className="text-[9px] text-slate-500">
                        de S/ {credit.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar of Consumption */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${isAvailable ? 'bg-emerald-400' : 'bg-slate-600'}`}
                      style={{ width: `${100 - usedPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>Emitido: {credit.createdAt}</span>
                    <span>Vence: {credit.expiresAt || 'Sin caducidad'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Refunds / Devoluciones (5 cols) */}
        <div className="lg:col-span-5 bg-[#0F1219] border border-slate-800 rounded p-4 space-y-3">
          <div className="border-b border-slate-800 pb-2">
            <span className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Historial de Devoluciones ({refunds.length})</span>
            </span>
          </div>

          <div className="space-y-2">
            {refunds.map((ref) => (
              <div
                key={ref.id}
                className="p-3 bg-[#161B22] border border-slate-800 rounded space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">{ref.studentName}</div>
                    <div className="text-[9px] text-slate-400">{ref.familyName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-rose-400">
                      - S/ {ref.amount.toFixed(2)}
                    </div>
                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono">
                      {ref.refundMethod}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 bg-[#0F1219] p-1.5 rounded border border-slate-800">
                  {ref.reason}
                </p>

                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>Por: {ref.processedBy}</span>
                  <span>{ref.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para Crear Saldo a Favor Manual */}
      {showAddCreditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B22] border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase">
                  Registrar Saldo a Favor de Familia
                </h3>
              </div>
              <button
                onClick={() => setShowAddCreditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCredit} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Familia / Alumno
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                >
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.familyName} — {stu.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Monto a Favor (PEN)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-emerald-400 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Validez (Meses)
                  </label>
                  <select
                    value={validityMonths}
                    onChange={(e) => setValidityMonths(Number(e.target.value))}
                    className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                  >
                    <option value={1}>1 Mes</option>
                    <option value={3}>3 Meses</option>
                    <option value={6}>6 Meses</option>
                    <option value={12}>1 Año</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Motivo de Compensación
                </label>
                <input
                  type="text"
                  required
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full bg-[#0D1117] border border-slate-700 rounded p-2 text-white text-xs"
                  placeholder="Ej: Clase suspendida por lluvia, Sobrepago de matrícula..."
                />
              </div>

              <div className="p-2.5 bg-[#0D1117] rounded border border-slate-800 text-[10px] text-slate-400">
                💡 Este saldo a favor aparecerá automáticamente al cobrar la siguiente pensión a esta familia en el módulo de Caja.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCreditModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Guardar Crédito</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
