import React, { useState } from 'react';
import { RotateCcw, X, Check, AlertTriangle } from 'lucide-react';
import { WebPayment, WebRefund } from '../types';

interface RefundModalProps {
  payment: WebPayment | null;
  onClose: () => void;
  onConfirmRefund: (refund: WebRefund, paymentId: string) => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  payment,
  onClose,
  onConfirmRefund,
}) => {
  if (!payment) return null;

  const [amount, setAmount] = useState<number>(payment.amount);
  const [reason, setReason] = useState('Ajuste por beca / convenio deportivo posterior al pago');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'YAPE' | 'PLIN' | 'BANK_TRANSFER'>(
    payment.paymentMethod === 'YAPE' ? 'YAPE' : payment.paymentMethod === 'PLIN' ? 'PLIN' : 'CASH'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > payment.amount) return;

    const refund: WebRefund = {
      id: `ref-${Date.now()}`,
      paymentId: payment.id,
      paymentRef: payment.referenceNumber,
      studentName: payment.studentName,
      familyName: payment.familyName,
      amount: Number(amount),
      reason,
      processedBy: 'Mateo Paredes (Caja)',
      refundMethod,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onConfirmRefund(refund, payment.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono text-xs">
      <div className="bg-[#0F1219] border border-slate-700 max-w-md w-full p-5 rounded-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white uppercase">
              Registrar Devolución / Reembolso
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pago Original Detalle */}
        <div className="bg-[#161B22] p-2.5 rounded border border-slate-800 space-y-1 text-[11px]">
          <div>
            Alumno: <strong className="text-white">{payment.studentName}</strong> ({payment.familyName})
          </div>
          <div>Concepto: {payment.description}</div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Ref: {payment.referenceNumber}</span>
            <span className="text-emerald-400 font-bold">Monto original: S/ {payment.amount.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Monto a Devolver (PEN)
              </label>
              <input
                type="number"
                step="0.10"
                min="1"
                max={payment.amount}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-rose-400 font-bold text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Método de Devolución
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as any)}
                className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white text-xs"
              >
                <option value="YAPE">Yape (Móvil)</option>
                <option value="PLIN">Plin (Móvil)</option>
                <option value="CASH">Efectivo en Caja</option>
                <option value="BANK_TRANSFER">Transferencia Bancaria</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Motivo de la Devolución
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#161B22] border border-slate-700 rounded p-2 text-white text-xs mb-1.5"
            >
              <option value="Ajuste por beca / convenio deportivo posterior al pago">
                Ajuste por beca / convenio deportivo posterior al pago
              </option>
              <option value="Cobro duplicado por error de comprobante">
                Cobro duplicado por error de comprobante
              </option>
              <option value="Retiro médico o inasistencia justificada de temporada">
                Retiro médico o inasistencia justificada de temporada
              </option>
              <option value="Devolución parcial por indumentaria fuera de stock">
                Devolución parcial por indumentaria fuera de stock
              </option>
              <option value="Otro motivo administrativo">Otro motivo administrativo</option>
            </select>
          </div>

          <div className="flex items-center gap-2 p-2 bg-rose-950/30 border border-rose-500/30 rounded text-[10px] text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>
              Esta devolución quedará registrada con fecha, hora y responsable de caja para auditoría.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Confirmar Devolución</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
