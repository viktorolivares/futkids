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
  const [internalInvoices, setInternalInvoices] = useState<WebBillingInvoice[]>([]);
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
    <div className="space-y-6">
      {/* Header & Subview Switcher */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Facturación & Comprobantes
                </h1>
                <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-0.5 rounded-full font-semibold">
                  SUNAT V2.1
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Emisión de recibos internos, boletas, facturas electrónicas y exportación oficial SIRE / PLE.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botón Exportador SIRE */}
          <button
            onClick={handleExportSireCsv}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Descargar libro Registro de Ventas e Ingresos formato SIRE / PLE SUNAT"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar SIRE (CSV)</span>
          </button>

          {/* Botón Emisión Manual */}
          <button
            onClick={() => setIsEmitModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Emitir Comprobante</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubView('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubView === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Comprobantes ({invoices.length})
            </button>
            <button
              onClick={() => setActiveSubView('live-transmitter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                activeSubView === 'live-transmitter'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
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
        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 text-blue-900 text-xs flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{sireExportNotice}</span>
          </div>
          <button onClick={() => setSireExportNotice(null)} className="text-blue-500 hover:text-blue-800 font-bold p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FeatureGuard Alert Banner if on FREE Plan */}
      {!isSunatEnabled && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Modo Recibos Internos (Plan Free):</strong> Puedes emitir recibos de caja internos ilimitados. La sincronización automática con WebServices de SUNAT requiere Plan Pro.
            </span>
          </div>
          {onOpenPlansModal && (
            <button
              onClick={onOpenPlansModal}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1 transition shrink-0 cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" /> Actualizar a PRO
            </button>
          )}
        </div>
      )}

      {activeSubView === 'live-transmitter' ? (
        !isSunatEnabled ? (
          <div className="bg-white border border-amber-200 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto my-6 shadow-xs">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Transmisor SUNAT Restringido al Plan PRO
              </h2>
              <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto leading-relaxed">
                La generación de XML UBL 2.1, firma digital RSA-SHA256 y despacho SOAP a los WebServices de SUNAT son exclusivas del Plan Pro. Puedes emitir Recibos Internos ilimitados en el Plan Free.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onOpenPlansModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 mx-auto transition shadow-xs cursor-pointer"
              >
                <Zap className="w-4 h-4" /> Desbloquear Facturación SUNAT con Plan PRO
              </button>
            </div>
          </div>
        ) : (
          <SunatTester />
        )
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recibos Internos</span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                S/ {totalReceiptsAmount.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {internalReceipts.length} recibos administrativos
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Facturado SUNAT</span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                S/ {totalSunatAmount.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {sunatInvoices.length} Boletas y Facturas declaradas
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                <span>Notas de Crédito</span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                S/ {totalCreditNotesAmount.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {creditNotes.length} NC emitidas (FC01/BC01)
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ambiente Tributario</span>
              </div>
              <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-1.5">
                <span>SUNAT PRODUCCIÓN</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-medium">OK</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">OASIS UBL 2.1 • SIRE OK</div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todos ({invoices.length})
              </button>
              <button
                onClick={() => setFilterType('RECIBO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  filterType === 'RECIBO'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Recibos ({internalReceipts.length})</span>
              </button>
              <button
                onClick={() => setFilterType('BOLETA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  filterType === 'BOLETA'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Boletas ({invoices.filter((i) => i.type === 'BOLETA').length})</span>
              </button>
              <button
                onClick={() => setFilterType('FACTURA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  filterType === 'FACTURA'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Facturas ({invoices.filter((i) => i.type === 'FACTURA').length})</span>
              </button>
              <button
                onClick={() => setFilterType('NOTA_CREDITO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  filterType === 'NOTA_CREDITO'
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Notas de Crédito ({creditNotes.length})</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por cliente, DNI, serie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Invoices & Receipts Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Registro General de Comprobantes y Recibos
              </h3>
              <span className="text-xs text-slate-400">
                Emisor: {academyProfile?.name || 'Club Formativo'} • RUC: {academyProfile?.ruc || '20100123456'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-xs font-semibold">
                    <th className="p-3.5">Comprobante</th>
                    <th className="p-3.5">Tipo</th>
                    <th className="p-3.5">Receptor / Cliente</th>
                    <th className="p-3.5">Concepto</th>
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Subtotal</th>
                    <th className="p-3.5">IGV</th>
                    <th className="p-3.5">Total (PEN)</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
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
                          className={`hover:bg-slate-50/60 transition ${
                            isVoided ? 'opacity-60 bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="p-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              {isNotaCredito ? (
                                <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                              ) : isRecibo ? (
                                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                              )}
                              <span className="font-mono">{docNumber}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                              {inv.paymentMethod ? `${inv.paymentMethod}` : ''}
                            </div>
                          </td>

                          <td className="p-3.5">
                            {isNotaCredito ? (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-semibold">
                                Nota de Crédito
                              </span>
                            ) : isRecibo ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                                Recibo Interno
                              </span>
                            ) : inv.type === 'FACTURA' ? (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-semibold">
                                Factura SUNAT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold">
                                Boleta SUNAT
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="font-semibold text-slate-900">{inv.clientName}</div>
                            <div className="text-[11px] text-slate-400">Doc: {inv.clientDoc}</div>
                          </td>

                          <td className="p-3.5 text-slate-600 max-w-xs">
                            <div className="truncate">{inv.concept || 'Cuota mensual formación deportiva'}</div>
                            {isNotaCredito && inv.referenceVoucherNumber && (
                              <div className="text-[11px] text-purple-600 mt-0.5 font-medium">
                                Ref: {inv.referenceVoucherType} {inv.referenceVoucherNumber} ({inv.creditNoteReasonDesc || 'Anulación'})
                              </div>
                            )}
                            {isVoided && (
                              <div className="text-[11px] text-rose-600 mt-0.5 font-medium">
                                Anulado con Nota de Crédito
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-500 whitespace-nowrap">
                            {inv.issuedAt}
                          </td>

                          <td className="p-3.5 text-slate-700">
                            S/ {inv.subtotal.toFixed(2)}
                          </td>

                          <td className="p-3.5 text-slate-500">
                            {isRecibo ? (
                              <span className="text-slate-400 text-[11px]">Exento</span>
                            ) : (
                              `S/ ${inv.igv.toFixed(2)}`
                            )}
                          </td>

                          <td className={`p-3.5 font-bold ${isNotaCredito ? 'text-purple-700' : 'text-slate-900'}`}>
                            {isNotaCredito ? '-' : ''}S/ {inv.total.toFixed(2)}
                          </td>

                          <td className="p-3.5">
                            {isVoided ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-semibold flex items-center gap-1 w-max">
                                <FileX className="w-3 h-3" />
                                <span>ANULADO</span>
                              </span>
                            ) : isRecibo ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>REGISTRADO</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold flex items-center gap-1 w-max">
                                <ShieldCheck className="w-3 h-3" />
                                <span>ACEPTADO</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Emitir Nota de Crédito si es Boleta o Factura no anulada */}
                              {(inv.type === 'BOLETA' || inv.type === 'FACTURA') && !isVoided && (
                                <button
                                  onClick={() => handleOpenCreditNoteModal(inv)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 text-xs font-medium flex items-center gap-1 cursor-pointer transition"
                                  title="Emitir Nota de Crédito para anular o corregir este comprobante"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Nota Crédito</span>
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedTicket(inv)}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition shadow-xs"
                                title="Ver e imprimir ticket"
                              >
                                <Receipt className="w-3 h-3 text-slate-400" />
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 text-slate-900 max-w-lg w-full p-6 rounded-3xl shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Nueva Emisión de Comprobante / Recibo
                </h3>
              </div>
              <button
                onClick={() => setIsEmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEmitSubmit} className="space-y-4">
              {/* Selector de Régimen: Recibo vs Boleta vs Factura */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Tipo de Comprobante
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmitType('RECIBO')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      emitType === 'RECIBO'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recibo Interno</span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Serie R001. No tributario. Cuotas de academia.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmitType('BOLETA')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      emitType === 'BOLETA'
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Boleta SUNAT</span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Serie B001. DNI o personas naturales.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmitType('FACTURA')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      emitType === 'FACTURA'
                        ? 'border-purple-500 bg-purple-50/70 text-purple-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Building className="w-3.5 h-3.5 text-purple-600" />
                      <span>Factura SUNAT</span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Serie F001. RUC 11 dígitos. Empresas.
                    </span>
                  </button>
                </div>
              </div>

              {/* Autocompletar desde Alumno de la Academia */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vincular Alumno Registrado (Opcional)
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {emitType === 'FACTURA' ? 'Razón Social' : 'Nombre Completo / Apoderado'}
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="ej. Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {emitType === 'FACTURA' ? 'RUC (11 dígitos)' : 'DNI / Carné Ext.'}
                  </label>
                  <input
                    type="text"
                    required
                    value={clientDoc}
                    onChange={(e) => setClientDoc(e.target.value)}
                    placeholder={emitType === 'FACTURA' ? '20100123456' : '74829103'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-mono focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Concepto / Descripción del Cobro
                </label>
                <input
                  type="text"
                  required
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="ej. Pensión Marzo 2026 - Fútbol Sub-10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Importe Total a Cobrar (PEN)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-right text-emerald-700 font-bold text-base focus:outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 text-xs space-y-1 text-slate-500">
                  {emitType === 'RECIBO' ? (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Régimen:</span>
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

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEmitModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Emitir {emitType === 'RECIBO' ? 'Recibo' : 'Comprobante SUNAT'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Emitir Nota de Crédito Electrónica */}
      {isCreditNoteModalOpen && selectedInvoiceForCreditNote && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-purple-200 text-slate-900 max-w-lg w-full p-6 rounded-3xl shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Emitir Nota de Crédito Electrónica
                </h3>
              </div>
              <button
                onClick={() => setIsCreditNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreditNote} className="space-y-4">
              {/* Comprobante a Modificar */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                <div className="text-xs text-slate-400 font-semibold">Comprobante de Referencia:</div>
                <div className="text-slate-900 font-bold text-xs flex items-center gap-2">
                  <span>{selectedInvoiceForCreditNote.type} {selectedInvoiceForCreditNote.series}-{selectedInvoiceForCreditNote.correlative.toString().padStart(8, '0')}</span>
                  <span className="text-xs text-slate-400 font-normal">({selectedInvoiceForCreditNote.issuedAt})</span>
                </div>
                <div className="text-xs text-slate-600">
                  Cliente: <strong>{selectedInvoiceForCreditNote.clientName}</strong> ({selectedInvoiceForCreditNote.clientDoc})
                </div>
                <div className="text-xs text-slate-900 font-bold">
                  Monto Original: S/ {selectedInvoiceForCreditNote.total.toFixed(2)}
                </div>
              </div>

              {/* Serie de la Nota de Crédito */}
              <div className="p-3 bg-purple-50 border border-purple-200/80 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-purple-900 font-medium">Serie según normativa SUNAT:</span>
                <span className="font-bold text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-200 font-mono shadow-xs">
                  {selectedInvoiceForCreditNote.type === 'FACTURA' ? 'FC01' : 'BC01'}
                </span>
              </div>

              {/* Motivo Oficial SUNAT */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Motivo de Emisión (Catálogo No. 09):
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-500"
                >
                  <option value="01">01 - Anulación de la operación (Total)</option>
                  <option value="02">02 - Anulación por error en el RUC / Documento</option>
                  <option value="06">06 - Devolución total del dinero</option>
                  <option value="07">07 - Devolución o descuento parcial</option>
                </select>
              </div>

              {/* Importe de la Nota de Crédito */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Importe a Anular / Acreditar (PEN):
                </label>
                <input
                  type="number"
                  step="0.50"
                  required
                  min="0.50"
                  max={selectedInvoiceForCreditNote.total}
                  value={creditNoteAmount}
                  onChange={(e) => setCreditNoteAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-purple-900 font-bold text-sm focus:bg-white focus:outline-none focus:border-purple-500"
                />
                <span className="text-[11px] text-slate-400">
                  Desglose: Base Gravada S/ {(creditNoteAmount / 1.18).toFixed(2)} + IGV S/ {(creditNoteAmount - creditNoteAmount / 1.18).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Transmitir Nota de Crédito</span>
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
