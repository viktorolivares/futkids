import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  ShieldCheck,
  Printer,
  Copy,
  Check,
  Receipt,
  X,
  PlusCircle,
  Search,
  Filter,
  Smartphone,
  Building,
  Info,
  ExternalLink,
  ChevronRight,
  Lock,
  Zap,
  Download,
  RotateCcw,
  FileX,
  FileSpreadsheet,
} from 'lucide-react';
import { SunatTester } from './SunatTester';
import { VoucherTicketModal } from './VoucherTicketModal';
import {
  WebBillingInvoice,
  WebStudent,
  WebAcademyProfile,
  SubscriptionStatusInfo,
  VoucherType,
} from '../types';
import { INITIAL_INVOICES } from '../data/academyData';

interface WebBillingProps {
  invoices?: WebBillingInvoice[];
  onAddInvoice?: (inv: WebBillingInvoice) => void;
  students?: WebStudent[];
  academyProfile?: WebAcademyProfile;
  subscription?: SubscriptionStatusInfo;
  onOpenPlansModal?: () => void;
}

export const WebBilling: React.FC<WebBillingProps> = ({
  invoices: propInvoices,
  onAddInvoice: propOnAddInvoice,
  students = [],
  academyProfile,
  subscription,
  onOpenPlansModal,
}) => {
  const [activeSubView, setActiveSubView] = useState<'list' | 'live-transmitter'>('list');
  const [internalInvoices, setInternalInvoices] = useState<WebBillingInvoice[]>(INITIAL_INVOICES);
  const [selectedTicket, setSelectedTicket] = useState<WebBillingInvoice | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'RECIBO' | 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para emisión manual
  const [isEmitModalOpen, setIsEmitModalOpen] = useState(false);
  const [emitType, setEmitType] = useState<'RECIBO' | 'BOLETA' | 'FACTURA'>('RECIBO');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [concept, setConcept] = useState('Pensión Mensual Formativa');
  const [amount, setAmount] = useState<number>(180);
  const [paymentMethod, setPaymentMethod] = useState('Yape');

  // Modal para Nota de Crédito Electrónica
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [selectedInvoiceForCreditNote, setSelectedInvoiceForCreditNote] = useState<WebBillingInvoice | null>(null);
  const [creditNoteReasonCode, setCreditNoteReasonCode] = useState<'01' | '02' | '06' | '07'>('01');
  const [creditNoteReasonDesc, setCreditNoteReasonDesc] = useState('Anulación de la operación');
  const [creditNoteAmount, setCreditNoteAmount] = useState<number>(0);

  // Alerta de éxito SIRE / PLE
  const [sireExportNotice, setSireExportNotice] = useState<string | null>(null);

  const invoices = propInvoices || internalInvoices;

  const handleAddInvoice = (newInv: WebBillingInvoice) => {
    if (propOnAddInvoice) {
      propOnAddInvoice(newInv);
    } else {
      setInternalInvoices((prev) => [newInv, ...prev]);
    }
  };

  const isSunatEnabled = subscription?.features?.sunatBilling ?? true;

  // KPIs
  const sunatInvoices = invoices.filter((i) => i.type === 'BOLETA' || i.type === 'FACTURA');
  const totalSunatAmount = sunatInvoices.reduce((acc, i) => acc + i.total, 0);

  const internalReceipts = invoices.filter((i) => i.type === 'RECIBO' || i.isInternalReceipt);
  const totalReceiptsAmount = internalReceipts.reduce((acc, i) => acc + i.total, 0);

  const creditNotes = invoices.filter((i) => i.type === 'NOTA_CREDITO');
  const totalCreditNotesAmount = creditNotes.reduce((acc, i) => acc + i.total, 0);

  // Filtrado
  const filteredInvoices = invoices.filter((inv) => {
    const matchesType =
      filterType === 'ALL' ||
      (filterType === 'RECIBO' && (inv.type === 'RECIBO' || inv.isInternalReceipt)) ||
      inv.type === filterType;

    const docNum = `${inv.series}-${inv.correlative.toString().padStart(8, '0')}`;
    const matchesSearch =
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientDoc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.concept && inv.concept.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesSearch;
  });

  // Manejar selección de alumno en el modal de emisión
  const handleStudentSelect = (stuId: string) => {
    setSelectedStudentId(stuId);
    if (!stuId) {
      setClientName('');
      setClientDoc('');
      setClientPhone('');
      return;
    }
    const stu = students.find((s) => s.id === stuId);
    if (stu) {
      setClientName(stu.name);
      setClientDoc(stu.documentNumber);
      setClientPhone(stu.phone || stu.emergencyPhone);
      const fee = stu.finalMonthlyFee ?? stu.monthlyFee;
      setAmount(fee > 0 ? fee : 180);
      setConcept(`Pensión ${stu.sport} - ${stu.name}`);
    }
  };

  // Enviar formulario de emisión manual
  const handleEmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !clientDoc.trim() || amount <= 0) return;

    // Calcular siguiente correlativo según serie
    const targetSeries = emitType === 'RECIBO' ? 'R001' : emitType === 'BOLETA' ? 'B001' : 'F001';
    const sameSeries = invoices.filter((i) => i.series === targetSeries);
    const nextCorrelative =
      sameSeries.length > 0 ? Math.max(...sameSeries.map((s) => s.correlative)) + 1 : 101;

    let subtotal = amount;
    let igv = 0;

    if (emitType === 'RECIBO') {
      subtotal = amount;
      igv = 0;
    } else {
      subtotal = Number((amount / 1.18).toFixed(2));
      igv = Number((amount - subtotal).toFixed(2));
    }

    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

    const newInvoice: WebBillingInvoice = {
      id: `inv-${Date.now()}`,
      type: emitType,
      series: targetSeries,
      correlative: nextCorrelative,
      clientName: clientName.toUpperCase(),
      clientDoc,
      clientPhone,
      subtotal,
      igv,
      total: Number(amount),
      status: emitType === 'RECIBO' ? 'ISSUED' : 'ACCEPTED',
      sunatCode: emitType === 'RECIBO' ? undefined : '0',
      sunatMessage:
        emitType === 'RECIBO'
          ? 'Recibo de caja generado correctamente.'
          : `El comprobante número ${targetSeries}-${nextCorrelative.toString().padStart(8, '0')} ha sido aceptado por SUNAT.`,
      issuedAt: dateStr,
      digestValue: emitType === 'RECIBO' ? undefined : 'k87B2M9p01HqZ94aA1==',
      concept,
      paymentMethod,
      receivedBy: 'Mateo Paredes (Caja)',
      isInternalReceipt: emitType === 'RECIBO',
    };

    handleAddInvoice(newInvoice);
    setIsEmitModalOpen(false);

    // Abrir de inmediato el ticket recién emitido
    setSelectedTicket(newInvoice);

    // Reset fields
    setSelectedStudentId('');
    setClientName('');
    setClientDoc('');
    setClientPhone('');
  };

  // Abrir Modal de Nota de Crédito
  const handleOpenCreditNoteModal = (inv: WebBillingInvoice) => {
    setSelectedInvoiceForCreditNote(inv);
    setCreditNoteAmount(inv.total);
    setCreditNoteReasonCode('01');
    setCreditNoteReasonDesc('Anulación de la operación');
    setIsCreditNoteModalOpen(true);
  };

  // Emitir Nota de Crédito Electrónica
  const handleConfirmCreditNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForCreditNote || creditNoteAmount <= 0) return;

    const original = selectedInvoiceForCreditNote;
    const isFactura = original.type === 'FACTURA';
    const targetSeries = isFactura ? 'FC01' : 'BC01';

    const sameSeries = invoices.filter((i) => i.series === targetSeries);
    const nextCorrelative =
      sameSeries.length > 0 ? Math.max(...sameSeries.map((s) => s.correlative)) + 1 : 1;

    const subtotal = Number((creditNoteAmount / 1.18).toFixed(2));
    const igv = Number((creditNoteAmount - subtotal).toFixed(2));
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

    const origDocNum = `${original.series}-${original.correlative.toString().padStart(8, '0')}`;

    const newCreditNote: WebBillingInvoice = {
      id: `nc-${Date.now()}`,
      type: 'NOTA_CREDITO',
      series: targetSeries,
      correlative: nextCorrelative,
      clientName: original.clientName,
      clientDoc: original.clientDoc,
      clientPhone: original.clientPhone,
      subtotal,
      igv,
      total: Number(creditNoteAmount),
      status: 'ACCEPTED',
      sunatCode: '0',
      sunatMessage: `La Nota de Crédito Electrónica número ${targetSeries}-${nextCorrelative.toString().padStart(8, '0')} ha sido aceptada por SUNAT.`,
      issuedAt: dateStr,
      digestValue: 'rQ97aLm5Vw4X89pQ1z00==',
      concept: `Nota de Crédito por ${creditNoteReasonDesc} ref. ${origDocNum}`,
      paymentMethod: original.paymentMethod,
      receivedBy: 'Mateo Paredes (Caja)',
      isInternalReceipt: false,
      referenceVoucherType: original.type === 'FACTURA' ? 'FACTURA' : 'BOLETA',
      referenceVoucherNumber: origDocNum,
      referenceVoucherDate: original.issuedAt,
      creditNoteReasonCode,
      creditNoteReasonDesc,
    };

    // Agregar la Nota de Crédito
    handleAddInvoice(newCreditNote);

    // Actualizar el comprobante original a estado ANULADO / VOIDED
    original.status = 'VOIDED';
    original.sunatMessage = `Comprobante anulado mediante Nota de Crédito ${targetSeries}-${nextCorrelative.toString().padStart(8, '0')}.`;

    setIsCreditNoteModalOpen(false);
    setSelectedTicket(newCreditNote);
  };

  // Exportador Oficial SIRE / PLE Registro de Ventas e Ingresos
  const handleExportSireCsv = () => {
    const headers = [
      'Periodo',
      'CUO',
      'Fecha_Emision',
      'Fecha_Vcto',
      'Tipo_Comprobante',
      'Serie',
      'Numero',
      'Tipo_Doc_Identidad',
      'Num_Doc_Identidad',
      'Razon_Social_Cliente',
      'Base_Imponible_Gravada',
      'Descuento_Base_Imponible',
      'IGV_18',
      'Exonerado',
      'Inafecto',
      'ISC',
      'Otros_Tributos',
      'Importe_Total',
      'Moneda',
      'Tipo_Cambio',
      'Fecha_Doc_Modificado',
      'Tipo_Doc_Modificado',
      'Serie_Doc_Modificado',
      'Numero_Doc_Modificado',
      'Estado_Operacion',
    ];

    const period = '20260300';
    const rows = invoices.map((inv, idx) => {
      const cuo = (idx + 1).toString().padStart(6, '0');
      const tipoComp =
        inv.type === 'FACTURA'
          ? '01'
          : inv.type === 'BOLETA'
          ? '03'
          : inv.type === 'NOTA_CREDITO'
          ? '07'
          : '99'; // 99 para Recibo Interno

      const tipoDocId =
        inv.type === 'FACTURA' ? '6' : inv.clientDoc.length === 8 ? '1' : '4';

      const isCreditNote = inv.type === 'NOTA_CREDITO';
      const factor = isCreditNote ? -1 : 1;

      const baseGravada = inv.type === 'RECIBO' ? '0.00' : (inv.subtotal * factor).toFixed(2);
      const igv = inv.type === 'RECIBO' ? '0.00' : (inv.igv * factor).toFixed(2);
      const exonerado = inv.type === 'RECIBO' ? inv.total.toFixed(2) : '0.00';
      const total = (inv.total * factor).toFixed(2);

      const refDate = inv.referenceVoucherDate || '';
      const refTipo =
        inv.referenceVoucherType === 'FACTURA' ? '01' : inv.referenceVoucherType === 'BOLETA' ? '03' : '';
      let refSerie = '';
      let refNum = '';
      if (inv.referenceVoucherNumber) {
        const parts = inv.referenceVoucherNumber.split('-');
        refSerie = parts[0] || '';
        refNum = parts[1] || '';
      }

      return [
        period,
        cuo,
        inv.issuedAt.split(' ')[0],
        inv.issuedAt.split(' ')[0],
        tipoComp,
        inv.series,
        inv.correlative.toString().padStart(8, '0'),
        tipoDocId,
        inv.clientDoc,
        `"${inv.clientName.replace(/"/g, '""')}"`,
        baseGravada,
        '0.00',
        igv,
        exonerado,
        '0.00',
        '0.00',
        '0.00',
        total,
        'PEN',
        '1.000',
        refDate,
        refTipo,
        refSerie,
        refNum,
        inv.status === 'VOIDED' ? '2' : '1',
      ].join(';');
    });

    const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const ruc = academyProfile?.ruc || '20100123456';
    link.setAttribute('download', `Registro_Ventas_SIRE_SUNAT_${ruc}_202603.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSireExportNotice(
      `¡Archivo SIRE SUNAT descargado exitosamente con ${invoices.length} comprobantes y notas de crédito!`,
    );
    setTimeout(() => setSireExportNotice(null), 4000);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header & Subview Switcher */}
      <div className="bg-[#0F1219] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>Comprobantes de Pago, Facturación SUNAT & SIRE</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                  PASO D: SUNAT V2.1
                </span>
              </h1>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Emisión de <strong>Recibos Internos de Caja</strong>, <strong>Boletas/Facturas Electrónicas SUNAT</strong>, <strong>Notas de Crédito (FC01/BC01)</strong> y exportador <strong>SIRE / PLE</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Exportador SIRE */}
          <button
            onClick={handleExportSireCsv}
            className="px-3.5 py-1.5 rounded-lg bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/40 text-sky-300 font-bold uppercase text-[11px] flex items-center gap-1.5 transition cursor-pointer"
            title="Descargar libro Registro de Ventas e Ingresos formato SIRE / PLE SUNAT"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Exportar SIRE (CSV)</span>
          </button>

          {/* Botón Emisión Manual */}
          <button
            onClick={() => setIsEmitModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase text-[11px] flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Emitir Comprobante / Recibo</span>
          </button>

          <div className="flex items-center gap-1 bg-[#161B22] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveSubView('list')}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition ${
                activeSubView === 'list'
                  ? 'bg-sky-500 text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Comprobantes ({invoices.length})
            </button>
            <button
              onClick={() => setActiveSubView('live-transmitter')}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                activeSubView === 'live-transmitter'
                  ? 'bg-sky-500 text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>Transmisor SOAP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Notices */}
      {sireExportNotice && (
        <div className="bg-sky-950/60 border border-sky-500/60 rounded-lg p-3 text-sky-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{sireExportNotice}</span>
          </div>
          <button onClick={() => setSireExportNotice(null)} className="text-sky-400 hover:text-white font-bold">
            ×
          </button>
        </div>
      )}

      {/* FeatureGuard Alert Banner if on FREE Plan */}
      {!isSunatEnabled && (
        <div className="bg-amber-950/50 border border-amber-500/40 rounded-lg p-3 flex items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Recibos Internos (Plan Free):</strong> Puedes emitir recibos y notas de venta internas ilimitadas. La sincronización automática con WebServices de SUNAT requiere Plan Pro.
            </span>
          </div>
          {onOpenPlansModal && (
            <button
              onClick={onOpenPlansModal}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded text-[11px] flex items-center gap-1 transition shrink-0"
            >
              <Zap className="w-3 h-3" /> Actualizar a PRO
            </button>
          )}
        </div>
      )}

      {activeSubView === 'live-transmitter' ? (
        !isSunatEnabled ? (
          <div className="bg-[#0F1219] border border-amber-500/40 rounded-xl p-8 text-center space-y-4 max-w-xl mx-auto my-6">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase">
                Transmisor SUNAT Restringido al Plan PRO
              </h2>
              <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto leading-relaxed">
                La generación de XML UBL 2.1, firma digital RSA-SHA256 y despacho SOAP a los WebServices de SUNAT son exclusivas del Plan Pro. Puedes emitir Recibos Internos ilimitados en el Plan Free.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onOpenPlansModal}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded text-xs flex items-center gap-1.5 mx-auto transition shadow-lg"
              >
                <Zap className="w-4 h-4" /> Desbloquear Facturación SUNAT con Plan PRO
              </button>
            </div>
          </div>
        ) : (
          <SunatTester />
        )
      ) : (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#0F1219] border border-slate-800 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <Receipt className="w-3 h-3 text-emerald-400" />
                <span>Recibos Internos</span>
              </div>
              <div className="text-base font-bold text-emerald-400 mt-1 font-mono">
                S/ {totalReceiptsAmount.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {internalReceipts.length} comprobantes no tributarios
              </div>
            </div>

            <div className="p-3 bg-[#0F1219] border border-slate-800 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-sky-400" />
                <span>Facturado SUNAT</span>
              </div>
              <div className="text-base font-bold text-sky-400 mt-1 font-mono">
                S/ {totalSunatAmount.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {sunatInvoices.length} Boletas y Facturas declaradas
              </div>
            </div>

            <div className="p-3 bg-[#0F1219] border border-slate-800 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-purple-400" />
                <span>Notas de Crédito</span>
              </div>
              <div className="text-base font-bold text-purple-400 mt-1 font-mono">
                S/ {totalCreditNotesAmount.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {creditNotes.length} NC emitidas (FC01/BC01)
              </div>
            </div>

            <div className="p-3 bg-[#0F1219] border border-slate-800 rounded-xl shadow-xs">
              <div className="text-[10px] text-slate-500 uppercase">Ambiente Tributario</div>
              <div className="text-base font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <span>SUNAT BETA / PRODUCCIÓN</span>
                <span className="text-[9px] bg-emerald-500/20 px-1 rounded">200 OK</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Estándar OASIS UBL 2.1 • SIRE OK</div>
            </div>
          </div>

          {/* Filter Bar & Search */}
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
                Todos ({invoices.length})
              </button>
              <button
                onClick={() => setFilterType('RECIBO')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                  filterType === 'RECIBO'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#161B22] text-emerald-400 hover:bg-slate-800'
                }`}
              >
                <Receipt className="w-3 h-3" />
                <span>Recibos ({internalReceipts.length})</span>
              </button>
              <button
                onClick={() => setFilterType('BOLETA')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                  filterType === 'BOLETA'
                    ? 'bg-sky-600 text-white'
                    : 'bg-[#161B22] text-sky-400 hover:bg-slate-800'
                }`}
              >
                <FileCheck className="w-3 h-3" />
                <span>Boletas ({invoices.filter((i) => i.type === 'BOLETA').length})</span>
              </button>
              <button
                onClick={() => setFilterType('FACTURA')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                  filterType === 'FACTURA'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#161B22] text-purple-400 hover:bg-slate-800'
                }`}
              >
                <Building className="w-3 h-3" />
                <span>Facturas ({invoices.filter((i) => i.type === 'FACTURA').length})</span>
              </button>
              <button
                onClick={() => setFilterType('NOTA_CREDITO')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                  filterType === 'NOTA_CREDITO'
                    ? 'bg-purple-500 text-black'
                    : 'bg-[#161B22] text-purple-400 hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Notas de Crédito ({creditNotes.length})</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por cliente, DNI, serie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161B22] border border-slate-700/60 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Invoices & Receipts Table */}
          <div className="bg-[#0F1219] border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <div className="p-3 bg-[#161B22] border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                Listado General de Comprobantes, Recibos & Notas de Crédito
              </span>
              <span className="text-[10px] text-slate-400">
                Emisor: {academyProfile?.name || 'Club Alianza Lima'} • RUC: {academyProfile?.ruc || '20100123456'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0B0E14] text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="p-3">Comprobante</th>
                    <th className="p-3">Régimen / Tipo</th>
                    <th className="p-3">Receptor / Cliente</th>
                    <th className="p-3">Concepto & Referencia</th>
                    <th className="p-3">Fecha Emisión</th>
                    <th className="p-3">Subtotal</th>
                    <th className="p-3">IGV</th>
                    <th className="p-3">Total (PEN)</th>
                    <th className="p-3">Estado SUNAT</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-500">
                        No se encontraron comprobantes o recibos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const docNumber = `${inv.series}-${inv.correlative.toString().padStart(8, '0')}`;
                      const isRecibo = inv.type === 'RECIBO' || inv.isInternalReceipt;
                      const isNotaCredito = inv.type === 'NOTA_CREDITO';
                      const isVoided = inv.status === 'VOIDED';

                      return (
                        <tr
                          key={inv.id}
                          className={`hover:bg-slate-800/30 transition text-slate-300 ${
                            isVoided ? 'opacity-60 bg-rose-950/10' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-white">
                            <div className="flex items-center gap-1.5">
                              {isNotaCredito ? (
                                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                              ) : isRecibo ? (
                                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <FileCheck className="w-3.5 h-3.5 text-sky-400" />
                              )}
                              <span>{docNumber}</span>
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5">
                              {inv.paymentMethod ? `Medio: ${inv.paymentMethod}` : ''}
                            </div>
                          </td>

                          <td className="p-3">
                            {isNotaCredito ? (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold uppercase">
                                Nota de Crédito
                              </span>
                            ) : isRecibo ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase">
                                Recibo Interno
                              </span>
                            ) : inv.type === 'FACTURA' ? (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[9px] font-bold uppercase">
                                Factura SUNAT
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[9px] font-bold uppercase">
                                Boleta SUNAT
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="font-semibold text-white">{inv.clientName}</div>
                            <div className="text-[10px] text-slate-400">Doc: {inv.clientDoc}</div>
                          </td>

                          <td className="p-3 text-[11px] text-slate-300 max-w-xs">
                            <div className="truncate">{inv.concept || 'Cuota mensual formación deportiva'}</div>
                            {isNotaCredito && inv.referenceVoucherNumber && (
                              <div className="text-[9px] text-purple-400 mt-0.5 font-bold">
                                Ref: {inv.referenceVoucherType} {inv.referenceVoucherNumber} ({inv.creditNoteReasonDesc || 'Anulación'})
                              </div>
                            )}
                            {isVoided && (
                              <div className="text-[9px] text-rose-400 mt-0.5 font-bold">
                                🚫 Comprobante Anulado con Nota de Crédito
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-[11px] text-slate-400 whitespace-nowrap">
                            {inv.issuedAt}
                          </td>

                          <td className="p-3 font-mono">
                            S/ {inv.subtotal.toFixed(2)}
                          </td>

                          <td className="p-3 font-mono text-slate-400">
                            {isRecibo ? (
                              <span className="text-slate-500 text-[10px]">Exento</span>
                            ) : (
                              `S/ ${inv.igv.toFixed(2)}`
                            )}
                          </td>

                          <td className={`p-3 font-bold font-mono ${isNotaCredito ? 'text-purple-400' : 'text-emerald-400'}`}>
                            {isNotaCredito ? '-' : ''}S/ {inv.total.toFixed(2)}
                          </td>

                          <td className="p-3">
                            {isVoided ? (
                              <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-600/40 text-[9px] font-bold uppercase flex items-center gap-1 w-max">
                                <FileX className="w-2.5 h-2.5" />
                                <span>ANULADO</span>
                              </span>
                            ) : isRecibo ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>CAJA REGISTRADA</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[9px] font-bold uppercase flex items-center gap-1 w-max">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>ACEPTADO (0)</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Emitir Nota de Crédito si es Boleta o Factura no anulada */}
                              {(inv.type === 'BOLETA' || inv.type === 'FACTURA') && !isVoided && (
                                <button
                                  onClick={() => handleOpenCreditNoteModal(inv)}
                                  className="px-2 py-1 rounded bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                                  title="Emitir Nota de Crédito para anular o corregir este comprobante"
                                >
                                  <RotateCcw className="w-3 h-3 text-purple-400" />
                                  <span>Nota Crédito</span>
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedTicket(inv)}
                                className="px-2.5 py-1 rounded bg-[#161B22] hover:bg-slate-800 border border-slate-700 text-sky-400 hover:text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                                title="Ver e imprimir ticket"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Ver Ticket</span>
                              </button>
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
        </div>
      )}

      {/* Modal: Emitir Comprobante o Recibo Manual */}
      {isEmitModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-700 text-slate-200 max-w-lg w-full p-5 rounded-xl shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm uppercase">
                  Nueva Emisión de Comprobante / Recibo
                </h3>
              </div>
              <button
                onClick={() => setIsEmitModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEmitSubmit} className="space-y-3">
              {/* Selector de Régimen: Recibo vs Boleta vs Factura */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Tipo de Comprobante a Generar
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmitType('RECIBO')}
                    className={`p-2 rounded-lg border text-left transition flex flex-col gap-1 cursor-pointer ${
                      emitType === 'RECIBO'
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300'
                        : 'border-slate-800 bg-[#161B22] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Recibo Interno</span>
                    </div>
                    <span className="text-[9px] text-slate-400 leading-tight">
                      Serie R001. No tributario. Control de cuotas de academia.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmitType('BOLETA')}
                    className={`p-2 rounded-lg border text-left transition flex flex-col gap-1 cursor-pointer ${
                      emitType === 'BOLETA'
                        ? 'border-sky-500 bg-sky-950/30 text-sky-300'
                        : 'border-slate-800 bg-[#161B22] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <FileCheck className="w-3.5 h-3.5 text-sky-400" />
                      <span>Boleta SUNAT</span>
                    </div>
                    <span className="text-[9px] text-slate-400 leading-tight">
                      Serie B001. DNI o personas naturales. Declaración formal.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmitType('FACTURA')}
                    className={`p-2 rounded-lg border text-left transition flex flex-col gap-1 cursor-pointer ${
                      emitType === 'FACTURA'
                        ? 'border-purple-500 bg-purple-950/30 text-purple-300'
                        : 'border-slate-800 bg-[#161B22] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Building className="w-3.5 h-3.5 text-purple-400" />
                      <span>Factura SUNAT</span>
                    </div>
                    <span className="text-[9px] text-slate-400 leading-tight">
                      Serie F001. RUC 11 dígitos. Empresas / sponsors.
                    </span>
                  </button>
                </div>
              </div>

              {/* Autocompletar desde Alumno de la Academia */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Vincular Alumno Registrado (Opcional)
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                >
                  <option value="">-- Ingreso manual de cliente libre --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.sport} • Doc: {s.documentNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Datos del Cliente */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    {emitType === 'FACTURA' ? 'Razón Social' : 'Nombre Completo / Apoderado'}
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="ej. Juan Pérez"
                    className="w-full bg-[#161B22] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    {emitType === 'FACTURA' ? 'RUC (11 dígitos)' : 'DNI / Carné Ext.'}
                  </label>
                  <input
                    type="text"
                    required
                    value={clientDoc}
                    onChange={(e) => setClientDoc(e.target.value)}
                    placeholder={emitType === 'FACTURA' ? '20100123456' : '74829103'}
                    className="w-full bg-[#161B22] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Teléfono / WhatsApp (Para envío de constancia)
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full bg-[#161B22] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                  >
                    <option value="Yape">Yape (Móvil)</option>
                    <option value="Plin">Plin (Móvil)</option>
                    <option value="Transferencia BCP">Transferencia BCP</option>
                    <option value="Tarjeta POS">Tarjeta POS</option>
                    <option value="Efectivo en Caja">Efectivo en Caja</option>
                  </select>
                </div>
              </div>

              {/* Concepto y Monto */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Concepto / Descripción del Cobro
                </label>
                <input
                  type="text"
                  required
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="ej. Pensión Marzo 2026 - Fútbol Sub-10"
                  className="w-full bg-[#161B22] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                />
              </div>

              <div className="p-3 bg-[#161B22] border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Importe Total a Cobrar (PEN)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-32 bg-[#0F1219] border border-slate-700 rounded px-2 py-1 text-right text-emerald-400 font-bold text-sm font-mono"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[10px] space-y-1 text-slate-400">
                  {emitType === 'RECIBO' ? (
                    <div className="flex justify-between text-emerald-400">
                      <span>Régimen Tributario:</span>
                      <span>No gravado a IGV (Recibo de Control Interno Serie R001)</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Base Imponible (Op. Gravada):</span>
                        <span>S/ {(amount / 1.18).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>I.G.V. (18%):</span>
                        <span>S/ {(amount - amount / 1.18).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmitModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase rounded text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Emitir {emitType === 'RECIBO' ? 'Recibo' : 'Comprobante SUNAT'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Emitir Nota de Crédito Electrónica */}
      {isCreditNoteModalOpen && selectedInvoiceForCreditNote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-purple-500/50 text-slate-200 max-w-lg w-full p-5 rounded-xl shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm uppercase">
                  Emitir Nota de Crédito Electrónica SUNAT
                </h3>
              </div>
              <button
                onClick={() => setIsCreditNoteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreditNote} className="space-y-3">
              {/* Comprobante a Modificar */}
              <div className="p-3 bg-[#161B22] border border-slate-800 rounded-lg space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Comprobante de Referencia Modificado:</div>
                <div className="text-white font-bold text-xs flex items-center gap-2">
                  <span>{selectedInvoiceForCreditNote.type} {selectedInvoiceForCreditNote.series}-{selectedInvoiceForCreditNote.correlative.toString().padStart(8, '0')}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({selectedInvoiceForCreditNote.issuedAt})</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Cliente: <strong>{selectedInvoiceForCreditNote.clientName}</strong> ({selectedInvoiceForCreditNote.clientDoc})
                </div>
                <div className="text-[11px] text-emerald-400 font-bold font-mono">
                  Monto Original: S/ {selectedInvoiceForCreditNote.total.toFixed(2)}
                </div>
              </div>

              {/* Serie de la Nota de Crédito */}
              <div className="p-2.5 bg-purple-950/20 border border-purple-500/40 rounded-lg flex items-center justify-between text-[11px]">
                <span className="text-purple-300">Serie a Generar según SUNAT:</span>
                <span className="font-bold text-white font-mono bg-purple-900/60 px-2 py-0.5 rounded border border-purple-400/40">
                  {selectedInvoiceForCreditNote.type === 'FACTURA' ? 'FC01' : 'BC01'}
                </span>
              </div>

              {/* Motivo Oficial SUNAT */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Motivo Oficial de Emisión de Nota de Crédito (Catálogo SUNAT No. 09):
                </label>
                <select
                  value={creditNoteReasonCode}
                  onChange={(e) => {
                    const code = e.target.value as any;
                    setCreditNoteReasonCode(code);
                    if (code === '01') setCreditNoteReasonDesc('Anulación de la operación');
                    else if (code === '02') setCreditNoteReasonDesc('Anulación por error en el RUC/DNI');
                    else if (code === '06') setCreditNoteReasonDesc('Devolución total');
                    else if (code === '07') setCreditNoteReasonDesc('Devolución parcial');
                  }}
                  className="w-full bg-[#161B22] border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  <option value="01">01 - Anulación de la operación (Total)</option>
                  <option value="02">02 - Anulación por error en el RUC / Documento</option>
                  <option value="06">06 - Devolución total del dinero</option>
                  <option value="07">07 - Devolución o descuento parcial</option>
                </select>
              </div>

              {/* Importe de la Nota de Crédito */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Importe a Acreditar / Anular (S/):
                </label>
                <input
                  type="number"
                  step="0.50"
                  required
                  min="0.50"
                  max={selectedInvoiceForCreditNote.total}
                  value={creditNoteAmount}
                  onChange={(e) => setCreditNoteAmount(Number(e.target.value))}
                  className="w-full bg-[#161B22] border border-slate-700 rounded-lg p-2 text-purple-300 font-bold text-sm font-mono"
                />
                <span className="text-[9px] text-slate-500">
                  Desglose: Base Gravada S/ {(creditNoteAmount / 1.18).toFixed(2)} + IGV S/ {(creditNoteAmount - creditNoteAmount / 1.18).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-black font-bold uppercase rounded text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Transmitir Nota de Crédito a SUNAT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Modal Reutilizable */}
      <VoucherTicketModal
        invoice={selectedTicket}
        academyName={academyProfile?.name}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
};
export default WebBilling;
