import React, { useState } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  Send,
  ExternalLink,
  Search,
  Filter,
  Users,
  Smartphone,
  Copy,
  Check,
  Calendar,
  X,
} from 'lucide-react';
import {
  WebStudent,
  WebFamily,
  WebCharge,
  WebAcademyProfile,
  WebWhatsAppReminderLog,
} from '../types';

interface WebPaymentRemindersViewProps {
  students: WebStudent[];
  families?: WebFamily[];
  charges?: WebCharge[];
  academyProfile?: WebAcademyProfile;
  onGoToCashierForStudent?: (studentId: string) => void;
}

const INITIAL_REMINDER_LOGS: WebWhatsAppReminderLog[] = [
  {
    id: 'rem-001',
    familyName: 'Familia Quispe López',
    studentName: 'Mateo Quispe',
    phone: '987654321',
    reminderType: 'OVERDUE',
    amount: 180.0,
    messageText: 'Estimado(a) Apoderado(a), le recordamos amablemente que la cuota de Mateo Quispe por S/ 180.00 se encuentra vencida.',
    sentAt: '2026-03-05 10:15',
    sentBy: 'Mateo Paredes (Caja)',
  },
];

export const WebPaymentRemindersView: React.FC<WebPaymentRemindersViewProps> = ({
  students,
  families = [],
  charges = [],
  academyProfile,
  onGoToCashierForStudent,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reminderLogs, setReminderLogs] = useState<WebWhatsAppReminderLog[]>(INITIAL_REMINDER_LOGS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Students with debt
  const debtorStudents = students.filter((s) => s.balance > 0);

  const filteredDebtors = debtorStudents.filter((stu) => {
    const matchesSearch =
      stu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stu.phone && stu.phone.includes(searchQuery)) ||
      (stu.emergencyPhone && stu.emergencyPhone.includes(searchQuery));

    if (filterType === 'OVERDUE') {
      return matchesSearch && stu.balance >= 180; // High balance/past due
    }
    return matchesSearch;
  });

  const totalDebt = debtorStudents.reduce((sum, s) => sum + s.balance, 0);

  const generateWhatsAppMessage = (stu: WebStudent) => {
    const fee = stu.balance > 0 ? stu.balance : (stu.finalMonthlyFee ?? stu.monthlyFee);
    const academyName = academyProfile?.name || 'Club Alianza Lima Academia';
    const yapeNumber = academyProfile?.phone || '987 654 321';
    const guardianName = stu.contactName || 'Estimado(a) Apoderado(a)';

    return `Hola ${guardianName}, te saludamos cordialmente de *${academyName}* ⚽🏀.

Te recordamos amablemente que se encuentra pendiente la cuota de formación deportiva de *${stu.name}* (${stu.sport}) por el monto de *S/ ${fee.toFixed(2)}*.

📲 *Medios de Pago Disponibles:*
• *Yape / Plin:* ${yapeNumber} (A nombre de la Academia)
• *Transferencia BCP Cta Cte:* 191-2849102-0-45 (CCI: 00219100284910204552)

Por favor, una vez realizado el pago, envíanos la constancia por este medio para emitir tu *Recibo o Comprobante Electrónico*.

¡Muchas gracias por confiar en la formación deportiva de tu campeón! 🏆`;
  };

  const handleSendReminder = (stu: WebStudent) => {
    const phone = stu.emergencyPhone || stu.phone || '987654321';
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
    const message = generateWhatsAppMessage(stu);

    // Save log
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);
    const newLog: WebWhatsAppReminderLog = {
      id: `rem-${Date.now()}`,
      familyId: stu.familyId,
      familyName: stu.familyName || stu.name,
      studentName: stu.name,
      phone: fullPhone,
      reminderType: stu.balance >= 180 ? 'OVERDUE' : 'DUE_TODAY',
      amount: stu.balance,
      messageText: message,
      sentAt: dateStr,
      sentBy: 'Mateo Paredes (Caja)',
    };

    setReminderLogs((prev) => [newLog, ...prev]);

    // Open WhatsApp Web/App
    const url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    setSuccessToast(`Recordatorio de cobranza preparado y registrado para ${stu.name}!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleCopyMessage = (stu: WebStudent) => {
    const msg = generateWhatsAppMessage(stu);
    navigator.clipboard.writeText(msg);
    setCopiedId(stu.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Centro de Cobranza Preventiva & WhatsApp</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                  COMUNICACIÓN DIRECTA
                </span>
              </h2>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Envío de recordatorios amables y avisos de morosidad con plantilla personalizada, enlaces de pago Yape/BCP y registro en bitácora.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#161B22] border border-slate-700/60 rounded-lg px-3 py-1.5 text-right font-mono">
            <div className="text-slate-500 text-[9px] uppercase font-bold">DEUDA TOTAL POR COBRAR</div>
            <div className="text-base font-bold text-rose-400">
              S/ {totalDebt.toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-400">{debtorStudents.length} alumnos con saldo</div>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-950/60 border border-emerald-500/60 rounded-lg p-3 text-emerald-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white font-bold">
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-3 bg-[#0F1219] border border-slate-800 rounded-xl shadow-xs">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Users className="w-3 h-3 text-rose-400" />
            <span>Alumnos con Saldo</span>
          </div>
          <div className="text-base font-bold text-rose-400 mt-1 font-mono">
            {debtorStudents.length} alumnos
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Requieren gestión de cobranza</div>
        </div>

        <div className="p-3 bg-[#0F1219] border border-slate-800 rounded-xl shadow-xs">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Morosos Críticos</span>
          </div>
          <div className="text-base font-bold text-amber-400 mt-1 font-mono">
            {debtorStudents.filter((s) => s.balance >= 180).length} alumnos
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Saldo mayor o igual a 1 mensualidad</div>
        </div>

        <div className="p-3 bg-[#0F1219] border border-slate-800 rounded-xl shadow-xs">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-emerald-400" />
            <span>Recordatorios Enviados</span>
          </div>
          <div className="text-base font-bold text-emerald-400 mt-1 font-mono">
            {reminderLogs.length} mensajes
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Bitácora histórica registrada</div>
        </div>

        <div className="p-3 bg-[#0F1219] border border-slate-800 rounded-xl shadow-xs">
          <div className="text-[10px] text-slate-500 uppercase">Canal de Notificación</div>
          <div className="text-base font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
            <span>WhatsApp Web</span>
            <span className="text-[9px] bg-emerald-500/20 px-1 rounded">Activo</span>
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Sin API pagada • Directo</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 uppercase mr-1">Filtrar:</span>
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
              filterType === 'ALL'
                ? 'bg-slate-700 text-white'
                : 'bg-[#161B22] text-slate-400 hover:text-white'
            }`}
          >
            Todos con Deuda ({debtorStudents.length})
          </button>
          <button
            onClick={() => setFilterType('OVERDUE')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition flex items-center gap-1 ${
              filterType === 'OVERDUE'
                ? 'bg-rose-600 text-white'
                : 'bg-[#161B22] text-rose-400 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Mayor o Igual a 1 Cuota ({debtorStudents.filter((s) => s.balance >= 180).length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por alumno, teléfono, deporte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161B22] border border-slate-700/60 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Debtors List Table */}
      <div className="bg-[#0F1219] border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-3 bg-[#161B22] border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-white text-xs uppercase tracking-wider">
            Alumnos con Saldo Pendiente de Pago
          </span>
          <span className="text-[10px] text-slate-400">
            Mostrando {filteredDebtors.length} de {debtorStudents.length} alumnos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B0E14] text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="p-3">Alumno</th>
                <th className="p-3">Deporte & Grupo</th>
                <th className="p-3">Contacto / Apoderado</th>
                <th className="p-3">Teléfono WhatsApp</th>
                <th className="p-3">Saldo Pendiente</th>
                <th className="p-3">Estado de Deuda</th>
                <th className="p-3 text-right">Acción de Cobranza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDebtors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No se encontraron alumnos con saldo pendiente bajo este filtro.
                  </td>
                </tr>
              ) : (
                filteredDebtors.map((stu) => {
                  const phone = stu.emergencyPhone || stu.phone || '987654321';
                  const isHighDebt = stu.balance >= 180;

                  return (
                    <tr key={stu.id} className="hover:bg-slate-800/30 transition text-slate-300">
                      <td className="p-3">
                        <div className="font-bold text-white">{stu.name}</div>
                        <div className="text-[10px] text-slate-500">Doc: {stu.documentNumber}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-sky-950/40 text-sky-400 border border-sky-500/30 text-[9px] font-bold uppercase">
                          {stu.sport}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{stu.groupName}</div>
                      </td>

                      <td className="p-3">
                        <div className="text-white font-semibold">{stu.contactName || stu.familyName || 'Apoderado'}</div>
                        <div className="text-[9px] text-slate-400">Titular de cuenta familiar</div>
                      </td>

                      <td className="p-3 font-mono text-emerald-400">
                        {phone}
                      </td>

                      <td className="p-3 font-bold font-mono text-rose-400 text-sm">
                        S/ {stu.balance.toFixed(2)}
                      </td>

                      <td className="p-3">
                        {isHighDebt ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-600/40 text-[9px] font-bold uppercase flex items-center gap-1 w-max">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>VENCIDO &gt; 1 MES</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase flex items-center gap-1 w-max">
                            <Clock className="w-2.5 h-2.5" />
                            <span>SALDO CORRIENTE</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Copiar Plantilla */}
                          <button
                            onClick={() => handleCopyMessage(stu)}
                            className="px-2 py-1 rounded bg-[#161B22] hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                            title="Copiar texto del recordatorio"
                          >
                            {copiedId === stu.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>

                          {/* Enviar WhatsApp */}
                          <button
                            onClick={() => handleSendReminder(stu)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                            title="Abrir WhatsApp para enviar aviso amigable de cobranza"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>Avisar WhatsApp</span>
                          </button>

                          {/* Cobrar en Caja */}
                          {onGoToCashierForStudent && (
                            <button
                              onClick={() => onGoToCashierForStudent(stu.id)}
                              className="px-2 py-1 rounded bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/40 text-sky-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              title="Ir al módulo de caja para registrar el pago"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Cobrar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bitácora de Envíos de Recordatorios */}
      <div className="bg-[#0F1219] border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-3.5 bg-[#161B22] border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bitácora de Recordatorios WhatsApp Enviados</span>
          </span>
          <span className="text-[10px] text-slate-400">Total Envíos: {reminderLogs.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B0E14] text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="p-3">Fecha / Hora</th>
                <th className="p-3">Alumno & Familia</th>
                <th className="p-3">Teléfono Destino</th>
                <th className="p-3">Monto Recordado</th>
                <th className="p-3">Tipo de Aviso</th>
                <th className="p-3">Gestor</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reminderLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition text-slate-300">
                  <td className="p-3 text-slate-400 whitespace-nowrap">
                    {log.sentAt}
                  </td>
                  <td className="p-3 font-semibold text-white">
                    <div>{log.studentName}</div>
                    <div className="text-[9px] text-slate-500">{log.familyName}</div>
                  </td>
                  <td className="p-3 font-mono text-emerald-400">
                    +{log.phone}
                  </td>
                  <td className="p-3 font-bold font-mono text-white">
                    S/ {log.amount.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase">
                      {log.reminderType === 'OVERDUE' ? 'Vencimiento' : 'Preventivo'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {log.sentBy}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase flex items-center gap-1 w-max">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>DESPACHADO</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default WebPaymentRemindersView;
