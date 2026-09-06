import React, { useState } from 'react';
import {
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calendar,
  User,
  Clock,
  Coins,
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck,
  X,
  FileText,
} from 'lucide-react';
import {
  WebPayment,
  WebCashClosing,
  WebAcademyProfile,
} from '../types';

interface WebCashClosingViewProps {
  payments: WebPayment[];
  academyProfile?: WebAcademyProfile;
  closings?: WebCashClosing[];
  onSaveClosing?: (closing: WebCashClosing) => void;
}

const INITIAL_CLOSINGS: WebCashClosing[] = [
  {
    id: 'cc-001',
    academyId: 'acad-001',
    closingNumber: 'CC-20260305-01',
    closedAt: '2026-03-05 21:30',
    closedBy: 'Mateo Paredes (Caja Central)',
    periodStart: '2026-03-05 08:00',
    periodEnd: '2026-03-05 21:30',
    totalCashSystem: 450.0,
    totalYapeSystem: 720.0,
    totalPlinSystem: 180.0,
    totalCardSystem: 360.0,
    totalTransferSystem: 540.0,
    totalSystem: 2250.0,
    cashCounted: 450.0,
    cashDifference: 0.0,
    notes: 'Cierre conforme sin diferencias en bóveda.',
    transactionsCount: 12,
    status: 'CLOSED',
  },
];

export const WebCashClosingView: React.FC<WebCashClosingViewProps> = ({
  payments,
  academyProfile,
  closings: propClosings,
  onSaveClosing,
}) => {
  const [closingsList, setClosingsList] = useState<WebCashClosing[]>(
    propClosings && propClosings.length > 0 ? propClosings : INITIAL_CLOSINGS
  );
  const [cashCountedInput, setCashCountedInput] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [selectedClosingTicket, setSelectedClosingTicket] = useState<WebCashClosing | null>(null);
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);

  // Group current payments by payment method
  const cashPayments = payments.filter((p) => p.paymentMethod === 'CASH');
  const yapePayments = payments.filter((p) => p.paymentMethod === 'YAPE');
  const plinPayments = payments.filter((p) => p.paymentMethod === 'PLIN');
  const cardPayments = payments.filter((p) => p.paymentMethod === 'CARD');
  const transferPayments = payments.filter((p) => p.paymentMethod === 'BANK_TRANSFER');

  const totalCashSystem = cashPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalYapeSystem = yapePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPlinSystem = plinPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCardSystem = cardPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalTransferSystem = transferPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalSystem = payments.reduce((sum, p) => sum + p.amount, 0);

  const cashCounted = cashCountedInput === '' ? totalCashSystem : Number(cashCountedInput) || 0;
  const cashDifference = cashCounted - totalCashSystem;

  const handleExecuteClosing = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);
    const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
    const closingNumber = `CC-${dateCode}-${(closingsList.length + 1).toString().padStart(2, '0')}`;

    const newClosing: WebCashClosing = {
      id: `cc-${Date.now()}`,
      academyId: academyProfile?.id || 'acad-001',
      closingNumber,
      closedAt: dateStr,
      closedBy: 'Mateo Paredes (Caja Central)',
      periodStart: `${dateStr.slice(0, 10)} 08:00`,
      periodEnd: dateStr,
      totalCashSystem,
      totalYapeSystem,
      totalPlinSystem,
      totalCardSystem,
      totalTransferSystem,
      totalSystem,
      cashCounted,
      cashDifference,
      notes: closingNotes.trim() || (cashDifference === 0 ? 'Cierre conforme' : `Diferencia de S/ ${cashDifference.toFixed(2)}`),
      transactionsCount: payments.length,
      status: 'CLOSED',
    };

    if (onSaveClosing) {
      onSaveClosing(newClosing);
    }
    setClosingsList((prev) => [newClosing, ...prev]);
    setSelectedClosingTicket(newClosing);
    setShowSuccessNotice(true);
    setTimeout(() => setShowSuccessNotice(false), 4000);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Cierre y Arqueo Diario de Caja (Corte Z)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                  AUDITORÍA EN VIVO
                </span>
              </h2>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Consolidación de ingresos por medio de pago (Efectivo, Yape, Plin, POS, Transferencias) y cuadre de caja física.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#161B22] border border-slate-700/60 rounded-lg px-3.5 py-2 text-right">
          <div className="text-slate-500 text-[9px] uppercase font-bold">TOTAL RECAUDADO EN EL TURNO</div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            S/ {totalSystem.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-400">{payments.length} transacciones registradas</div>
        </div>
      </div>

      {showSuccessNotice && (
        <div className="bg-emerald-950/60 border border-emerald-500/60 rounded-lg p-3 text-emerald-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>¡Cierre diario registrado exitosamente! El comprobante de arqueo ha sido emitido.</span>
          </div>
          <button onClick={() => setShowSuccessNotice(false)} className="text-emerald-400 hover:text-white font-bold">
            ×
          </button>
        </div>
      )}

      {/* Grid: Desglose por Medio de Pago vs Formulario de Arqueo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Desglose por Medios de Pago */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>Ingresos Registrados por Sistema (Ventas del Día)</span>
              </span>
              <span className="text-[10px] text-slate-500">Fecha: {new Date().toISOString().slice(0, 10)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Efectivo */}
              <div className="p-3 bg-[#161B22] border border-emerald-500/30 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Efectivo en Caja</span>
                  </span>
                  <span className="text-[10px] bg-emerald-950/50 px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
                    {cashPayments.length} pagos
                  </span>
                </div>
                <div className="text-base font-bold text-white mt-1 font-mono">
                  S/ {totalCashSystem.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Sujeto a conteo físico en gaveta</div>
              </div>

              {/* Yape */}
              <div className="p-3 bg-[#161B22] border border-purple-500/30 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-bold text-purple-400">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Yape Móvil</span>
                  </span>
                  <span className="text-[10px] bg-purple-950/50 px-1.5 py-0.5 rounded text-purple-300 border border-purple-500/30">
                    {yapePayments.length} pagos
                  </span>
                </div>
                <div className="text-base font-bold text-white mt-1 font-mono">
                  S/ {totalYapeSystem.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Billetera Digital BCP</div>
              </div>

              {/* Plin */}
              <div className="p-3 bg-[#161B22] border border-sky-500/30 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-bold text-sky-400">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Plin Móvil</span>
                  </span>
                  <span className="text-[10px] bg-sky-950/50 px-1.5 py-0.5 rounded text-sky-300 border border-sky-500/30">
                    {plinPayments.length} pagos
                  </span>
                </div>
                <div className="text-base font-bold text-white mt-1 font-mono">
                  S/ {totalPlinSystem.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Interbank / BBVA / Scotiabank</div>
              </div>

              {/* POS Tarjetas */}
              <div className="p-3 bg-[#161B22] border border-amber-500/30 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Tarjetas POS</span>
                  </span>
                  <span className="text-[10px] bg-amber-950/50 px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/30">
                    {cardPayments.length} pagos
                  </span>
                </div>
                <div className="text-base font-bold text-white mt-1 font-mono">
                  S/ {totalCardSystem.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Izipay / Niubiz POS</div>
              </div>

              {/* Transferencias */}
              <div className="p-3 bg-[#161B22] border border-blue-500/30 rounded-lg sm:col-span-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-bold text-blue-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Transferencias Bancarias (BCP / BBVA / Interbank)</span>
                  </span>
                  <span className="text-[10px] bg-blue-950/50 px-1.5 py-0.5 rounded text-blue-300 border border-blue-500/30">
                    {transferPayments.length} pagos
                  </span>
                </div>
                <div className="text-base font-bold text-white mt-1 font-mono">
                  S/ {totalTransferSystem.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Acreditación directa en cuenta corriente</div>
              </div>
            </div>

            {/* Total Consolidado */}
            <div className="p-3 bg-[#0B0E14] border border-slate-700/60 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-xs uppercase">Total General del Sistema</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Suma de todos los medios de pago ingresados</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  S/ {totalSystem.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Arqueo y Cuadre de Caja */}
        <div className="lg:col-span-5">
          <form onSubmit={handleExecuteClosing} className="bg-[#0F1219] border border-slate-800 rounded-xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Arqueo de Efectivo Físico</span>
              </span>
              <span className="text-[9px] bg-sky-950/50 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded font-mono">
                TURNO CENTRAL
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Efectivo Esperado en Gaveta (Sistema):
                </label>
                <div className="p-2.5 bg-[#161B22] border border-slate-700/60 rounded-lg text-emerald-400 font-bold font-mono text-sm">
                  S/ {totalCashSystem.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Efectivo Físico Contado (Billetes + Monedas):
                </label>
                <input
                  type="number"
                  step="0.10"
                  required
                  min="0"
                  value={cashCountedInput}
                  onChange={(e) => setCashCountedInput(e.target.value)}
                  placeholder={`ej. ${totalCashSystem.toFixed(2)}`}
                  className="w-full bg-[#161B22] border border-slate-700 rounded-lg px-3 py-2 text-white font-bold font-mono text-sm focus:outline-none focus:border-sky-500"
                />
                <span className="text-[9px] text-slate-500 block mt-1">
                  Ingresa el monto real contado en la caja física al cierre del turno.
                </span>
              </div>

              {/* Resultado del Cuadre */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                cashDifference === 0
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : cashDifference < 0
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              }`}>
                <div>
                  <div className="text-[10px] uppercase font-bold flex items-center gap-1">
                    {cashDifference === 0 ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Caja Conforme (Sin Diferencia)</span>
                      </>
                    ) : cashDifference < 0 ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Diferencia Faltante en Caja</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Diferencia Sobrante en Caja</span>
                      </>
                    )}
                  </div>
                  <span className="text-[9px] opacity-80 block mt-0.5">
                    Físico Contado: S/ {cashCounted.toFixed(2)} vs Sistema: S/ {totalCashSystem.toFixed(2)}
                  </span>
                </div>
                <div className="text-right font-mono font-bold text-sm">
                  {cashDifference > 0 ? '+' : ''}S/ {cashDifference.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Observaciones / Justificación de Caja:
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="ej. Turno tarde sin incidencias. Se resguarda fondo de caja de S/ 100 para mañana."
                  className="w-full bg-[#161B22] border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase rounded-lg text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer transition"
              >
                <Receipt className="w-4 h-4" />
                <span>Generar Cierre Definitivo (Corte Z)</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Historial de Cierres de Caja */}
      <div className="bg-[#0F1219] border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-3.5 bg-[#161B22] border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Historial de Cierres Diarios y Arqueos Emitidos</span>
          </span>
          <span className="text-[10px] text-slate-400">Total Cierres: {closingsList.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B0E14] text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="p-3">N° Cierre</th>
                <th className="p-3">Fecha / Hora</th>
                <th className="p-3">Cajero Responsable</th>
                <th className="p-3">Efectivo Sistema</th>
                <th className="p-3">Efectivo Contado</th>
                <th className="p-3">Diferencia</th>
                <th className="p-3">Total Recaudado</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {closingsList.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition text-slate-300">
                  <td className="p-3 font-bold text-white font-mono">
                    {c.closingNumber}
                  </td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">
                    {c.closedAt}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-white">{c.closedBy}</div>
                    <div className="text-[9px] text-slate-500">{c.transactionsCount} operaciones</div>
                  </td>
                  <td className="p-3 font-mono">
                    S/ {c.totalCashSystem.toFixed(2)}
                  </td>
                  <td className="p-3 font-mono text-white font-semibold">
                    S/ {c.cashCounted.toFixed(2)}
                  </td>
                  <td className="p-3 font-mono">
                    {c.cashDifference === 0 ? (
                      <span className="text-emerald-400 font-bold">S/ 0.00</span>
                    ) : c.cashDifference < 0 ? (
                      <span className="text-rose-400 font-bold">-S/ {Math.abs(c.cashDifference).toFixed(2)}</span>
                    ) : (
                      <span className="text-amber-400 font-bold">+S/ {c.cashDifference.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="p-3 font-bold font-mono text-emerald-400">
                    S/ {c.totalSystem.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase flex items-center gap-1 w-max">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>CERRADO</span>
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedClosingTicket(c)}
                      className="px-2.5 py-1 rounded bg-[#161B22] hover:bg-slate-800 border border-slate-700 text-sky-400 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ml-auto"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Ver Ticket Z</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ticket de Cierre de Caja (Corte Z) */}
      {selectedClosingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-700 text-slate-200 max-w-md w-full p-5 rounded-xl shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm uppercase">
                  Comprobante de Cierre Diario (Corte Z)
                </h3>
              </div>
              <button
                onClick={() => setSelectedClosingTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ticket Printable Layout */}
            <div className="p-4 bg-white text-black rounded-lg space-y-3 font-mono shadow-inner">
              <div className="text-center border-b border-dashed border-gray-400 pb-2">
                <h4 className="font-bold text-sm uppercase">{academyProfile?.name || 'CLUB ALIANZA LIMA ACADEMIA'}</h4>
                <div className="text-[10px] text-gray-600">RUC: {academyProfile?.ruc || '20100123456'}</div>
                <div className="text-[10px] text-gray-600">CIERRE DIARIO DE CAJA (CORTE Z)</div>
                <div className="text-xs font-bold text-black mt-1">{selectedClosingTicket.closingNumber}</div>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-gray-400 pb-2 text-gray-700">
                <div><strong>Fecha de Cierre:</strong> {selectedClosingTicket.closedAt}</div>
                <div><strong>Cajero:</strong> {selectedClosingTicket.closedBy}</div>
                <div><strong>Periodo:</strong> {selectedClosingTicket.periodStart} a {selectedClosingTicket.periodEnd}</div>
                <div><strong>Transacciones:</strong> {selectedClosingTicket.transactionsCount}</div>
              </div>

              <div className="text-[11px] space-y-1 border-b border-dashed border-gray-400 pb-2">
                <div className="font-bold text-xs uppercase text-gray-800">Desglose por Medio de Pago:</div>
                <div className="flex justify-between">
                  <span>Efectivo Sistema:</span>
                  <span className="font-bold">S/ {selectedClosingTicket.totalCashSystem.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Yape Móvil:</span>
                  <span className="font-bold">S/ {selectedClosingTicket.totalYapeSystem.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plin Móvil:</span>
                  <span className="font-bold">S/ {selectedClosingTicket.totalPlinSystem.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>POS / Tarjetas:</span>
                  <span className="font-bold">S/ {selectedClosingTicket.totalCardSystem.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transferencias:</span>
                  <span className="font-bold">S/ {selectedClosingTicket.totalTransferSystem.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs border-t border-gray-300 pt-1 text-black">
                  <span>TOTAL RECAUDADO:</span>
                  <span>S/ {selectedClosingTicket.totalSystem.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[11px] space-y-1 border-b border-dashed border-gray-400 pb-2 bg-gray-100 p-2 rounded">
                <div className="font-bold text-xs uppercase text-gray-800">Resultado del Arqueo Físico:</div>
                <div className="flex justify-between">
                  <span>Efectivo Contado:</span>
                  <span className="font-bold">S/ {selectedClosingTicket.cashCounted.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diferencia de Caja:</span>
                  <span className={`font-bold ${
                    selectedClosingTicket.cashDifference === 0
                      ? 'text-emerald-700'
                      : selectedClosingTicket.cashDifference < 0
                      ? 'text-red-700'
                      : 'text-amber-700'
                  }`}>
                    {selectedClosingTicket.cashDifference === 0
                      ? 'S/ 0.00 (CONFORME)'
                      : `${selectedClosingTicket.cashDifference > 0 ? '+' : ''}S/ ${selectedClosingTicket.cashDifference.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {selectedClosingTicket.notes && (
                <div className="text-[9px] text-gray-600">
                  <strong>Obs:</strong> {selectedClosingTicket.notes}
                </div>
              )}

              <div className="text-center text-[9px] text-gray-500 pt-2 border-t border-dashed border-gray-400">
                Comprobante de Control Interno emitido por el Software de Academia
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedClosingTicket(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase rounded text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket Z</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WebCashClosingView;
