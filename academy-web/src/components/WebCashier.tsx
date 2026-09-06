import React, { useState } from 'react';
import {
  DollarSign,
  CreditCard,
  Send,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  Receipt,
  Plus,
  ArrowDownLeft,
  Smartphone,
  Building,
  Coins,
  Search,
  Award,
  Tag,
  Percent,
  Info,
  Printer,
  X,
  Share2,
  Ticket,
  Users,
  RotateCcw,
  Gift,
  Check,
  Sparkles,
  Layers,
  CheckSquare,
  Square,
  UserPlus,
  Calculator,
  MessageSquare,
} from 'lucide-react';
import {
  WebPayment,
  WebCharge,
  WebStudent,
  WebBillingInvoice,
  WebAcademyProfile,
  WebCustomerCredit,
  WebRefund,
  WebPackage,
  WebPackageCredit,
  WebTrial,
  WebPromotion,
  WebFamily,
  WebPaymentAllocation,
  WebInvoiceItem,
} from '../types';
import { VoucherTicketModal } from './VoucherTicketModal';
import { WebCreditsLedger } from './WebCreditsLedger';
import { WebPackagesAndPromos } from './WebPackagesAndPromos';
import { WebTrialsList } from './WebTrialsList';
import { RefundModal } from './RefundModal';
import { WebCashClosingView } from './WebCashClosingView';
import { WebPaymentRemindersView } from './WebPaymentRemindersView';

interface WebCashierProps {
  payments: WebPayment[];
  charges: WebCharge[];
  students: WebStudent[];
  families?: WebFamily[];
  preselectedStudent?: WebStudent | null;
  preselectedFamily?: WebFamily | null;
  onClearPreselectedStudent?: () => void;
  onClearPreselectedFamily?: () => void;
  invoices?: WebBillingInvoice[];
  academyProfile?: WebAcademyProfile;
  customerCredits?: WebCustomerCredit[];
  refunds?: WebRefund[];
  packages?: WebPackage[];
  packageCredits?: WebPackageCredit[];
  trials?: WebTrial[];
  promotions?: WebPromotion[];
  onAddPayment: (newPayment: WebPayment, newInvoice?: WebBillingInvoice) => void;
  onEmitInvoiceForPayment: (payment: WebPayment, invoiceType?: 'RECIBO' | 'BOLETA' | 'FACTURA') => void;
  onAddCustomerCredit?: (credit: WebCustomerCredit) => void;
  onApplyCustomerCredit?: (creditId: string, usedAmount: number) => void;
  onAddRefund?: (refund: WebRefund, paymentId: string) => void;
  onAddPackageCredit?: (packageCredit: WebPackageCredit) => void;
  onConsumePackageCredit?: (studentId: string) => void;
  onAddPackage?: (newPackage: WebPackage) => void;
  onAddPromotion?: (newPromo: WebPromotion) => void;
  onConvertTrial?: (trialId: string) => void;
}

export const WebCashier: React.FC<WebCashierProps> = ({
  payments,
  charges,
  students,
  families = [],
  preselectedStudent,
  preselectedFamily,
  onClearPreselectedStudent,
  onClearPreselectedFamily,
  invoices = [],
  academyProfile,
  customerCredits = [],
  refunds = [],
  packages = [],
  packageCredits = [],
  trials = [],
  promotions = [],
  onAddPayment,
  onEmitInvoiceForPayment,
  onAddCustomerCredit = () => {},
  onApplyCustomerCredit = () => {},
  onAddRefund = () => {},
  onAddPackageCredit = () => {},
  onConsumePackageCredit = () => {},
  onAddPackage = () => {},
  onAddPromotion = () => {},
  onConvertTrial = () => {},
}) => {
  // Navigation tabs within Cashier module
  const [activeSubTab, setActiveSubTab] = useState<'CASHIER' | 'CLOSING' | 'REMINDERS' | 'CREDITS' | 'PACKAGES' | 'TRIALS'>('CASHIER');

  // Checkout Mode: Individual vs Consolidado Familiar
  const [checkoutMode, setCheckoutMode] = useState<'SINGLE_STUDENT' | 'FAMILY_CONSOLIDATED'>(
    preselectedFamily ? 'FAMILY_CONSOLIDATED' : 'SINGLE_STUDENT'
  );

  // Selected Family State
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(
    preselectedFamily?.id || (families.length > 0 ? families[0].id : '')
  );

  // Family multi-charge selection and partial amount overrides
  const [selectedChargeIds, setSelectedChargeIds] = useState<Record<string, boolean>>({});
  const [chargePaymentAmounts, setChargePaymentAmounts] = useState<Record<string, number>>({});

  // Synchronize with preselected student or family navigation
  React.useEffect(() => {
    if (preselectedFamily) {
      setCheckoutMode('FAMILY_CONSOLIDATED');
      setSelectedFamilyId(preselectedFamily.id);
      if (onClearPreselectedFamily) onClearPreselectedFamily();
    }
  }, [preselectedFamily]);

  React.useEffect(() => {
    if (preselectedStudent) {
      setCheckoutMode('SINGLE_STUDENT');
      setSelectedStudentId(preselectedStudent.id);
      if (onClearPreselectedStudent) onClearPreselectedStudent();
    }
  }, [preselectedStudent]);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[1]?.id || students[0]?.id || ''
  );
  const [conceptCategory, setConceptCategory] = useState<'MONTHLY_FEE' | 'PACKAGE' | 'KIT' | 'OTHER'>('MONTHLY_FEE');
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || '');
  const [amount, setAmount] = useState<number>(180.0);
  const [method, setMethod] = useState<'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CARD' | 'CASH'>('YAPE');
  const [refNumber, setRefNumber] = useState(`OP-${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [description, setDescription] = useState('Pensión Mensual Marzo 2026');

  // Promotional code state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<WebPromotion | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  // Credit at family disposal
  const [applyFamilyCredit, setApplyFamilyCredit] = useState(false);

  // Opción de comprobante: Por defecto RECIBO interno (lo más usado por dueños de academias)
  const [voucherChoice, setVoucherChoice] = useState<'RECIBO' | 'BOLETA' | 'FACTURA' | 'NONE'>('RECIBO');

  const [filterSearch, setFilterSearch] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [lastCreatedTicket, setLastCreatedTicket] = useState<WebBillingInvoice | null>(null);
  const [ticketToView, setTicketToView] = useState<WebBillingInvoice | null>(null);

  // Modal para emisión retroactiva de comprobante
  const [retroPayment, setRetroPayment] = useState<WebPayment | null>(null);
  const [retroType, setRetroType] = useState<'RECIBO' | 'BOLETA' | 'FACTURA'>('RECIBO');

  // Modal para registrar devolución / reembolso
  const [paymentToRefund, setPaymentToRefund] = useState<WebPayment | null>(null);

  // Current active family and its pending charges
  const currentFamily = families.find((f) => f.id === selectedFamilyId) || families[0];
  const familyPendingCharges = charges.filter(
    (c) => c.familyId === selectedFamilyId && c.status !== 'PAID' && c.status !== 'CANCELLED'
  );

  // Initialize selected charges and amounts whenever family or charges change
  React.useEffect(() => {
    const initSelected: Record<string, boolean> = {};
    const initAmounts: Record<string, number> = {};
    familyPendingCharges.forEach((c) => {
      initSelected[c.id] = true;
      initAmounts[c.id] = c.balance;
    });
    setSelectedChargeIds(initSelected);
    setChargePaymentAmounts(initAmounts);
  }, [selectedFamilyId, charges.length]);

  // Family credit for selected family
  const availableCreditsForFamily = customerCredits.filter(
    (c) => c.familyId === selectedFamilyId && c.status === 'AVAILABLE' && c.remaining > 0
  );
  const totalFamilyAvailableCredit = availableCreditsForFamily.reduce(
    (acc, c) => acc + c.remaining,
    0
  );

  // Calculations for Family Consolidated Payment
  const familySelectedCharges = familyPendingCharges.filter((c) => selectedChargeIds[c.id]);
  const familyGrossSubtotal = familySelectedCharges.reduce(
    (sum, c) => sum + (Number(chargePaymentAmounts[c.id]) || 0),
    0
  );

  let familyPromoDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountPct) {
      familyPromoDiscount = (familyGrossSubtotal * appliedPromo.discountPct) / 100;
    } else if (appliedPromo.discountFixed) {
      familyPromoDiscount = appliedPromo.discountFixed;
    }
  }

  const familySubtotalAfterPromo = Math.max(0, familyGrossSubtotal - familyPromoDiscount);
  const familyCreditDiscount = applyFamilyCredit
    ? Math.min(totalFamilyAvailableCredit, familySubtotalAfterPromo)
    : 0;
  const familyFinalAmount = Math.max(0, familySubtotalAfterPromo - familyCreditDiscount);

  // Totales
  const yapeTotal = payments
    .filter((p) => p.paymentMethod === 'YAPE')
    .reduce((acc, p) => acc + p.amount, 0);
  const plinTotal = payments
    .filter((p) => p.paymentMethod === 'PLIN')
    .reduce((acc, p) => acc + p.amount, 0);
  const bankTotal = payments
    .filter((p) => p.paymentMethod === 'BANK_TRANSFER')
    .reduce((acc, p) => acc + p.amount, 0);
  const cardCashTotal = payments
    .filter((p) => p.paymentMethod === 'CARD' || p.paymentMethod === 'CASH')
    .reduce((acc, p) => acc + p.amount, 0);
  const grandTotal = payments.reduce((acc, p) => acc + p.amount, 0);

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  // Family credits calculation
  const availableFamilyCredits = customerCredits.filter(
    (c) => c.familyId === currentStudent?.familyId && c.status === 'AVAILABLE' && c.remaining > 0
  );
  const totalFamilyCredit = availableFamilyCredits.reduce((acc, c) => acc + c.remaining, 0);

  // Calculation of discounts
  const calculateFinalToCharge = () => {
    let base = amount;
    let promoDiscount = 0;
    if (appliedPromo) {
      if (appliedPromo.discountPct) {
        promoDiscount = (base * appliedPromo.discountPct) / 100;
      } else if (appliedPromo.discountFixed) {
        promoDiscount = appliedPromo.discountFixed;
      }
    }
    const subtotalAfterPromo = Math.max(0, base - promoDiscount);
    const creditDiscount = applyFamilyCredit ? Math.min(totalFamilyCredit, subtotalAfterPromo) : 0;
    const finalAmount = Math.max(0, subtotalAfterPromo - creditDiscount);
    return {
      base,
      promoDiscount,
      creditDiscount,
      finalAmount,
    };
  };

  const { promoDiscount, creditDiscount, finalAmount } = calculateFinalToCharge();

  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    const stu = students.find((s) => s.id === id);
    if (stu) {
      if (conceptCategory === 'MONTHLY_FEE') {
        const effectiveFee =
          stu.finalMonthlyFee !== undefined
            ? stu.finalMonthlyFee
            : stu.scholarshipType === 'FULL_SCHOLARSHIP'
            ? 0
            : stu.scholarshipType === 'HALF_SCHOLARSHIP'
            ? stu.monthlyFee * 0.5
            : stu.monthlyFee;

        const chargeAmount = stu.balance > 0 ? stu.balance : effectiveFee;
        setAmount(chargeAmount);
        if (stu.scholarshipType === 'FULL_SCHOLARSHIP') {
          setDescription(`Kit Oficial / Indumentaria - ${stu.name} (Beca 100%)`);
        } else {
          setDescription(`Pensión ${stu.sport} - ${stu.name}`);
        }
      }
    }
  };

  const handleCategoryChange = (cat: 'MONTHLY_FEE' | 'PACKAGE' | 'KIT' | 'OTHER') => {
    setConceptCategory(cat);
    if (cat === 'PACKAGE') {
      const pkg = packages.find((p) => p.id === selectedPackageId) || packages[0];
      if (pkg) {
        setAmount(pkg.price);
        setDescription(`Tiquetera ${pkg.name} (${pkg.classCount} clases + ${pkg.bonusClasses} bonus)`);
      }
    } else if (cat === 'KIT') {
      setAmount(85.0);
      setDescription(`Kit Oficial de Entrenamiento (Camiseta + Short + Medias)`);
    } else if (cat === 'OTHER') {
      setAmount(50.0);
      setDescription(`Matrícula o Inscripción a Torneo Oficial`);
    } else {
      if (currentStudent) {
        const fee = currentStudent.finalMonthlyFee ?? currentStudent.monthlyFee;
        setAmount(currentStudent.balance > 0 ? currentStudent.balance : fee);
        setDescription(`Pensión ${currentStudent.sport} - ${currentStudent.name}`);
      }
    }
  };

  const handlePackageSelect = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const pkg = packages.find((p) => p.id === pkgId);
    if (pkg) {
      setAmount(pkg.price);
      setDescription(`Tiquetera ${pkg.name} (${pkg.classCount} clases + ${pkg.bonusClasses} bonus)`);
    }
  };

  const handleApplyPromoCode = () => {
    if (!promoCodeInput.trim()) return;
    const code = promoCodeInput.trim().toUpperCase();
    const found = promotions.find((p) => p.code.toUpperCase() === code && p.isActive);

    if (found) {
      setAppliedPromo(found);
      const discountLabel = found.discountPct
        ? `${found.discountPct}% de descuento`
        : found.discountFixed
        ? `S/ ${found.discountFixed.toFixed(2)} de descuento`
        : `${found.bonusClasses} clases bonus`;
      setPromoMessage(`✅ Cupón "${found.code}" aplicado: ${found.name} (${discountLabel})`);
    } else {
      setAppliedPromo(null);
      setPromoMessage(`❌ Código "${code}" no válido o vencido`);
    }
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

    let invoiceNumber: string | undefined = undefined;
    let invoiceStatus: 'ACCEPTED' | 'ISSUED' | undefined = undefined;
    let newInvoice: WebBillingInvoice | undefined = undefined;

    const netCharged = Number(finalAmount);

    if (voucherChoice !== 'NONE') {
      const series = voucherChoice === 'RECIBO' ? 'R001' : voucherChoice === 'BOLETA' ? 'B001' : 'F001';
      const existingInSeries = invoices.filter((i) => i.series === series);
      const nextNum =
        existingInSeries.length > 0
          ? Math.max(...existingInSeries.map((s) => s.correlative)) + 1
          : series === 'R001'
          ? 203
          : series === 'B001'
          ? 106
          : 43;

      invoiceNumber = `${series}-${nextNum.toString().padStart(8, '0')}`;
      invoiceStatus = voucherChoice === 'RECIBO' ? 'ISSUED' : 'ACCEPTED';

      let subtotal = netCharged;
      let igv = 0;
      if (voucherChoice !== 'RECIBO') {
        subtotal = Number((netCharged / 1.18).toFixed(2));
        igv = Number((netCharged - subtotal).toFixed(2));
      }

      newInvoice = {
        id: `inv-${Date.now()}`,
        type: voucherChoice,
        series,
        correlative: nextNum,
        clientName: student.name.toUpperCase(),
        clientDoc: student.documentNumber,
        clientPhone: student.phone,
        subtotal,
        igv,
        total: netCharged,
        status: invoiceStatus,
        sunatCode: voucherChoice === 'RECIBO' ? undefined : '0',
        sunatMessage:
          voucherChoice === 'RECIBO'
            ? 'Recibo de caja generado correctamente.'
            : `Comprobante ${invoiceNumber} aceptado por SUNAT.`,
        issuedAt: dateStr,
        digestValue: voucherChoice === 'RECIBO' ? undefined : 'r91B3F2oJ0z2Hq4b7A9g==',
        concept: `${description}${appliedPromo ? ` (Cupón: ${appliedPromo.code})` : ''}${creditDiscount > 0 ? ` (Deducido S/ ${creditDiscount.toFixed(2)} saldo a favor)` : ''}`,
        paymentMethod: method,
        receivedBy: 'Mateo Paredes (Caja)',
        isInternalReceipt: voucherChoice === 'RECIBO',
      };
    }

    const newPayment: WebPayment = {
      id: `pay-${Date.now()}`,
      academyId: student.academyId,
      studentName: student.name,
      familyName: student.familyName,
      amount: netCharged,
      paymentMethod: method,
      referenceNumber: refNumber,
      paidAt: dateStr,
      receivedBy: 'Mateo Paredes (Caja)',
      description: `${description}${appliedPromo ? ` [Desc. ${appliedPromo.code}]` : ''}${creditDiscount > 0 ? ` [Crédito S/ -${creditDiscount.toFixed(2)}]` : ''}`,
      invoiceType: voucherChoice !== 'NONE' ? voucherChoice : undefined,
      invoiceNumber,
      invoiceStatus,
      studentPhone: student.phone,
    };

    // 1. Process payment & invoice
    onAddPayment(newPayment, newInvoice);

    // 2. If it was a package purchase, generate PackageCredit
    if (conceptCategory === 'PACKAGE') {
      const pkg = packages.find((p) => p.id === selectedPackageId) || packages[0];
      if (pkg) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + (pkg.validityDays || 60));

        const newPkgCredit: WebPackageCredit = {
          id: `pkgc-${Date.now()}`,
          studentId: student.id,
          studentName: student.name,
          packageId: pkg.id,
          packageName: pkg.name,
          totalClasses: pkg.classCount + pkg.bonusClasses + (appliedPromo?.bonusClasses || 0),
          usedClasses: 0,
          expiresAt: expDate.toISOString().split('T')[0],
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 10),
          status: 'ACTIVE',
        };
        onAddPackageCredit(newPkgCredit);
      }
    }

    // 3. If family credit was applied, deduct it
    if (applyFamilyCredit && creditDiscount > 0 && availableFamilyCredits[0]) {
      onApplyCustomerCredit(availableFamilyCredits[0].id, creditDiscount);
    }

    if (newInvoice) {
      setLastCreatedTicket(newInvoice);
    } else {
      setLastCreatedTicket(null);
    }

    setPaymentSuccess(`Pago de S/ ${newPayment.amount.toFixed(2)} registrado con éxito.`);
    setTimeout(() => setPaymentSuccess(null), 4000);

    // Reset fields
    setRefNumber(`OP-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoMessage(null);
    setApplyFamilyCredit(false);
  };

  const handleProcessFamilyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || familySelectedCharges.length === 0) return;

    const netCharged = Number(familyFinalAmount);
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

    const primaryContact =
      currentFamily.contacts.find((c) => c.isPrimary) || currentFamily.contacts[0];
    const clientName = primaryContact
      ? primaryContact.fullName.toUpperCase()
      : currentFamily.name.toUpperCase();
    const clientDoc = primaryContact?.documentNumber || '74829103';
    const clientPhone = primaryContact?.phone || '+51 987 654 321';

    const paymentId = `pay-${Date.now()}`;

    // Allocations linked to each selected charge
    const allocations: WebPaymentAllocation[] = familySelectedCharges.map((c, idx) => ({
      id: `alc-${Date.now()}-${idx}`,
      paymentId,
      chargeId: c.id,
      chargeDescription: c.description,
      studentId: c.studentId,
      studentName: c.studentName,
      amount: Number(chargePaymentAmounts[c.id]) || c.balance,
      allocatedAt: dateStr,
    }));

    // Invoice line items (itemized billing!)
    const invoiceItems: WebInvoiceItem[] = familySelectedCharges.map((c) => ({
      description: `${c.description} — ${c.studentName}`,
      quantity: 1,
      unitPrice: Number(chargePaymentAmounts[c.id]) || c.balance,
      total: Number(chargePaymentAmounts[c.id]) || c.balance,
      studentName: c.studentName,
    }));

    let invoiceNumber: string | undefined = undefined;
    let invoiceStatus: 'ACCEPTED' | 'ISSUED' | undefined = undefined;
    let newInvoice: WebBillingInvoice | undefined = undefined;

    if (voucherChoice !== 'NONE') {
      const series = voucherChoice === 'RECIBO' ? 'R001' : voucherChoice === 'BOLETA' ? 'B001' : 'F001';
      const existingInSeries = invoices.filter((i) => i.series === series);
      const nextNum =
        existingInSeries.length > 0
          ? Math.max(...existingInSeries.map((s) => s.correlative)) + 1
          : series === 'R001'
          ? 203
          : series === 'B001'
          ? 106
          : 43;

      invoiceNumber = `${series}-${nextNum.toString().padStart(8, '0')}`;
      invoiceStatus = voucherChoice === 'RECIBO' ? 'ISSUED' : 'ACCEPTED';

      let subtotal = netCharged;
      let igv = 0;
      if (voucherChoice !== 'RECIBO') {
        subtotal = Number((netCharged / 1.18).toFixed(2));
        igv = Number((netCharged - subtotal).toFixed(2));
      }

      newInvoice = {
        id: `inv-${Date.now()}`,
        type: voucherChoice,
        series,
        correlative: nextNum,
        clientName,
        clientDoc,
        clientPhone,
        familyId: currentFamily.id,
        familyName: currentFamily.name,
        subtotal,
        igv,
        total: netCharged,
        status: invoiceStatus,
        sunatCode: voucherChoice === 'RECIBO' ? undefined : '0',
        sunatMessage:
          voucherChoice === 'RECIBO'
            ? 'Recibo consolidado familiar emitido correctamente.'
            : `Comprobante ${invoiceNumber} aceptado por SUNAT.`,
        issuedAt: dateStr,
        digestValue: voucherChoice === 'RECIBO' ? undefined : 'm49A8K2oP1z8Hq7b2Y8z==',
        concept: `Cobro Consolidado ${currentFamily.name} (${familySelectedCharges.length} conceptos hermanos)`,
        items: invoiceItems,
        paymentMethod: method,
        receivedBy: 'Mateo Paredes (Caja)',
        isInternalReceipt: voucherChoice === 'RECIBO',
      };
    }

    const uniqueStudents = Array.from(new Set(familySelectedCharges.map((c) => c.studentName)));

    const newPayment: WebPayment = {
      id: paymentId,
      academyId: currentFamily.academyId,
      familyId: currentFamily.id,
      familyName: currentFamily.name,
      studentName: uniqueStudents.join(', '),
      amount: netCharged,
      paymentMethod: method,
      referenceNumber: refNumber,
      paidAt: dateStr,
      receivedBy: 'Mateo Paredes (Caja)',
      description: `Cobro Consolidado: ${familySelectedCharges.map((c) => `${c.studentName} (${c.chargeType})`).join(' + ')}${appliedPromo ? ` [Cupón: ${appliedPromo.code}]` : ''}${familyCreditDiscount > 0 ? ` [Crédito Fam. -S/ ${familyCreditDiscount.toFixed(2)}]` : ''}`,
      invoiceType: voucherChoice !== 'NONE' ? voucherChoice : undefined,
      invoiceNumber,
      invoiceStatus,
      studentPhone: clientPhone,
      allocations,
    };

    onAddPayment(newPayment, newInvoice);

    if (applyFamilyCredit && familyCreditDiscount > 0 && availableCreditsForFamily[0]) {
      onApplyCustomerCredit(availableCreditsForFamily[0].id, familyCreditDiscount);
    }

    if (newInvoice) {
      setLastCreatedTicket(newInvoice);
    } else {
      setLastCreatedTicket(null);
    }

    setPaymentSuccess(
      `Cobro Consolidado de S/ ${netCharged.toFixed(2)} para ${currentFamily.name} registrado con éxito.`
    );
    setTimeout(() => setPaymentSuccess(null), 5000);

    // Reset
    setRefNumber(`OP-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoMessage(null);
    setApplyFamilyCredit(false);
  };

  // Helper para abrir ticket desde la tabla de pagos
  const handleOpenTicketForPayment = (pay: WebPayment) => {
    const found = invoices.find(
      (i) => `${i.series}-${i.correlative.toString().padStart(8, '0')}` === pay.invoiceNumber
    );
    if (found) {
      setTicketToView(found);
      return;
    }

    const isRecibo = pay.invoiceType === 'RECIBO' || pay.invoiceNumber?.startsWith('R');
    const series = isRecibo ? 'R001' : pay.invoiceType === 'FACTURA' ? 'F001' : 'B001';
    const num = pay.invoiceNumber
      ? parseInt(pay.invoiceNumber.split('-')[1], 10) || 101
      : 101;

    let subtotal = pay.amount;
    let igv = 0;
    if (!isRecibo) {
      subtotal = Number((pay.amount / 1.18).toFixed(2));
      igv = Number((pay.amount - subtotal).toFixed(2));
    }

    const synthesized: WebBillingInvoice = {
      id: `synth-${pay.id}`,
      type: isRecibo ? 'RECIBO' : (pay.invoiceType as any) || 'BOLETA',
      series,
      correlative: num,
      clientName: pay.studentName.toUpperCase(),
      clientDoc: '74829103',
      clientPhone: pay.studentPhone || '+51 987 654 321',
      subtotal,
      igv,
      total: pay.amount,
      status: isRecibo ? 'ISSUED' : 'ACCEPTED',
      issuedAt: pay.paidAt,
      concept: pay.description,
      paymentMethod: pay.paymentMethod,
      receivedBy: pay.receivedBy,
      isInternalReceipt: isRecibo,
    };

    setTicketToView(synthesized);
  };

  const handleConfirmRetroEmit = () => {
    if (!retroPayment) return;
    onEmitInvoiceForPayment(retroPayment, retroType);
    setRetroPayment(null);
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.studentName.toLowerCase().includes(filterSearch.toLowerCase()) ||
      p.referenceNumber.toLowerCase().includes(filterSearch.toLowerCase()) ||
      p.paymentMethod.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(filterSearch.toLowerCase()))
  );

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h1 className="text-base font-bold text-white uppercase tracking-wide">
              Caja, Cobranzas & Emisión de Comprobantes Perú
            </h1>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Registro de pensiones, tiqueteras, saldos a favor, promociones y emisión de <strong>Recibo de Caja Interno</strong> o <strong>Boleta/Factura SUNAT</strong>.
          </p>
        </div>

        <div className="bg-[#161B22] border border-slate-700/60 rounded px-3 py-1.5 text-right font-mono">
          <div className="text-slate-500 text-[9px] uppercase">TOTAL COBRADO EN CAJA HOY</div>
          <div className="text-base font-bold text-emerald-400">
            S/ {grandTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto text-[11px]">
        <button
          onClick={() => setActiveSubTab('CASHIER')}
          className={`px-3 py-1.5 rounded font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'CASHIER'
              ? 'bg-emerald-500 text-black shadow-sm'
              : 'bg-[#161B22] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Caja & Cobranzas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CLOSING')}
          className={`px-3 py-1.5 rounded font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'CLOSING'
              ? 'bg-emerald-500 text-black shadow-sm'
              : 'bg-[#161B22] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cierre & Arqueo Z</span>
        </button>

        <button
          onClick={() => setActiveSubTab('REMINDERS')}
          className={`px-3 py-1.5 rounded font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'REMINDERS'
              ? 'bg-emerald-500 text-black shadow-sm'
              : 'bg-[#161B22] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cobranza WhatsApp</span>
          {students.filter((s) => s.balance > 0).length > 0 && (
            <span className="bg-rose-950 text-rose-300 border border-rose-500/40 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
              {students.filter((s) => s.balance > 0).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('CREDITS')}
          className={`px-3 py-1.5 rounded font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'CREDITS'
              ? 'bg-emerald-500 text-black shadow-sm'
              : 'bg-[#161B22] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-emerald-400" />
          <span>Saldos a Favor & Devoluciones</span>
          {customerCredits.filter((c) => c.status === 'AVAILABLE' && c.remaining > 0).length > 0 && (
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
              {customerCredits.filter((c) => c.status === 'AVAILABLE' && c.remaining > 0).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('PACKAGES')}
          className={`px-3 py-1.5 rounded font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'PACKAGES'
              ? 'bg-emerald-500 text-black shadow-sm'
              : 'bg-[#161B22] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Ticket className="w-3.5 h-3.5 text-purple-400" />
          <span>Tiqueteras & Promociones</span>
          <span className="bg-purple-950 text-purple-300 border border-purple-500/40 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
            {packageCredits.filter((p) => p.status === 'ACTIVE').length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('TRIALS')}
          className={`px-3 py-1.5 rounded font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'TRIALS'
              ? 'bg-emerald-500 text-black shadow-sm'
              : 'bg-[#161B22] text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <span>Clases de Prueba (Trials)</span>
          {trials.filter((t) => !t.converted).length > 0 && (
            <span className="bg-sky-950 text-sky-300 border border-sky-500/40 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
              {trials.filter((t) => !t.converted).length}
            </span>
          )}
        </button>
      </div>

      {/* RENDER VIEW ACCORDING TO ACTIVE SUBTAB */}

      {activeSubTab === 'CLOSING' && (
        <WebCashClosingView
          payments={payments}
          academyProfile={academyProfile}
        />
      )}

      {activeSubTab === 'REMINDERS' && (
        <WebPaymentRemindersView
          students={students}
          families={families}
          charges={charges}
          academyProfile={academyProfile}
          onGoToCashierForStudent={(stuId) => {
            setActiveSubTab('CASHIER');
            setCheckoutMode('SINGLE_STUDENT');
            handleStudentSelect(stuId);
          }}
        />
      )}

      {activeSubTab === 'CREDITS' && (
        <WebCreditsLedger
          customerCredits={customerCredits}
          refunds={refunds}
          students={students}
          onAddCustomerCredit={onAddCustomerCredit}
        />
      )}

      {activeSubTab === 'PACKAGES' && (
        <WebPackagesAndPromos
          packages={packages}
          packageCredits={packageCredits}
          promotions={promotions}
          students={students}
          onAddPackageCredit={onAddPackageCredit}
          onConsumePackageCredit={onConsumePackageCredit}
          onAddPackage={onAddPackage}
          onAddPromotion={onAddPromotion}
          onSelectPackageForSale={(pkg, stuId) => {
            setActiveSubTab('CASHIER');
            setConceptCategory('PACKAGE');
            setSelectedPackageId(pkg.id);
            setAmount(pkg.price);
            setDescription(`Tiquetera ${pkg.name} (${pkg.classCount} clases + ${pkg.bonusClasses} bonus)`);
            if (stuId) setSelectedStudentId(stuId);
          }}
        />
      )}

      {activeSubTab === 'TRIALS' && (
        <WebTrialsList
          trials={trials}
          onConvertTrial={onConvertTrial}
        />
      )}

      {activeSubTab === 'CASHIER' && (
        <>
          {/* Methods Breakdown Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 bg-[#0F1219] border border-slate-800 rounded">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                <Smartphone className="w-3 h-3 text-purple-400" />
                <span>YAPE</span>
              </div>
              <div className="text-base font-bold text-purple-400 mt-1">
                S/ {yapeTotal.toFixed(2)}
              </div>
            </div>

            <div className="p-3 bg-[#0F1219] border border-slate-800 rounded">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                <Smartphone className="w-3 h-3 text-sky-400" />
                <span>PLIN</span>
              </div>
              <div className="text-base font-bold text-sky-400 mt-1">
                S/ {plinTotal.toFixed(2)}
              </div>
            </div>

            <div className="p-3 bg-[#0F1219] border border-slate-800 rounded">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                <Building className="w-3 h-3 text-amber-400" />
                <span>TRANSFERENCIA BCP</span>
              </div>
              <div className="text-base font-bold text-amber-400 mt-1">
                S/ {bankTotal.toFixed(2)}
              </div>
            </div>

            <div className="p-3 bg-[#0F1219] border border-slate-800 rounded">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                <Coins className="w-3 h-3 text-emerald-400" />
                <span>TARJETA / EFECTIVO</span>
              </div>
              <div className="text-base font-bold text-emerald-400 mt-1">
                S/ {cardCashTotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Immediate Success Banner after payment */}
          {paymentSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded p-3 flex items-center justify-between gap-3 text-emerald-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{paymentSuccess}</span>
              </div>
              {lastCreatedTicket && (
                <button
                  onClick={() => setTicketToView(lastCreatedTicket)}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-[11px] flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ver e Imprimir Ticket</span>
                </button>
              )}
            </div>
          )}

          {/* Main Grid: Form Left (5 cols) & Ledger Right (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left (5 cols): Payment Registration Form */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-[#0F1219] border border-slate-800 rounded p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nuevo Cobro en Caja</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Cajero: Mateo Paredes
                  </span>
                </div>

                {/* Selector de Modo: Cobro Individual vs Consolidado Familiar */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#161B22] rounded border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCheckoutMode('SINGLE_STUDENT')}
                    className={`py-1.5 px-2 rounded font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      checkoutMode === 'SINGLE_STUDENT'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Cobro Individual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutMode('FAMILY_CONSOLIDATED')}
                    className={`py-1.5 px-2 rounded font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      checkoutMode === 'FAMILY_CONSOLIDATED'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Consolidado Familiar</span>
                  </button>
                </div>

                {checkoutMode === 'FAMILY_CONSOLIDATED' ? (
                  <form onSubmit={handleProcessFamilyPayment} className="space-y-3">
                    {/* Selector de Familia */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-purple-400 uppercase tracking-wider font-bold flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          <span>Seleccionar Familia</span>
                        </label>
                        <span className="text-[10px] text-slate-500">
                          {families.length} familias registradas
                        </span>
                      </div>
                      <select
                        value={selectedFamilyId}
                        onChange={(e) => setSelectedFamilyId(e.target.value)}
                        className="w-full bg-[#161B22] border border-purple-500/40 rounded px-2.5 py-1.5 text-white text-xs font-bold"
                      >
                        {families.map((fam) => {
                          const famStudents = students.filter((s) => s.familyId === fam.id);
                          const famPending = charges.filter(
                            (c) => c.familyId === fam.id && c.status !== 'PAID' && c.status !== 'CANCELLED'
                          );
                          const famDebt = famPending.reduce((sum, c) => sum + c.balance, 0);
                          return (
                            <option key={fam.id} value={fam.id}>
                              {fam.name} ({famStudents.length} {famStudents.length === 1 ? 'hijo' : 'hijos'}) {famDebt > 0 ? `— Debe S/ ${famDebt.toFixed(2)}` : '— Al día'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Ficha Resumen de la Familia y Apoderado */}
                    {currentFamily && (
                      <div className="p-2.5 bg-purple-950/20 border border-purple-500/30 rounded space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{currentFamily.name}</span>
                              {currentFamily.billingPreference && (
                                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                                  {currentFamily.billingPreference}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {currentFamily.contacts[0] ? (
                                <span>
                                  Apoderado: <strong className="text-slate-200">{currentFamily.contacts[0].fullName}</strong> ({currentFamily.contacts[0].relationship}) • Doc: {currentFamily.contacts[0].documentNumber || '—'}
                                </span>
                              ) : (
                                <span>Sin apoderado principal</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">Deuda Familia</div>
                            <div className="font-mono font-bold text-rose-400 text-sm">
                              S/ {familyPendingCharges.reduce((s, c) => s + c.balance, 0).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Hermanos Inscritos */}
                        <div className="pt-1 border-t border-purple-500/20 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-purple-300 font-bold">Hijos:</span>
                          {students
                            .filter((s) => s.familyId === currentFamily.id)
                            .map((st) => (
                              <span
                                key={st.id}
                                className="text-[10px] bg-[#161B22] border border-slate-700 text-slate-200 px-2 py-0.5 rounded flex items-center gap-1"
                              >
                                <span>{st.name}</span>
                                <span className="text-[8px] text-emerald-400 font-mono">({st.sport})</span>
                              </span>
                            ))}
                        </div>

                        {/* Saldo a Favor de la Familia disponible */}
                        {totalFamilyAvailableCredit > 0 && (
                          <div className="pt-1 border-t border-purple-500/20 flex items-center justify-between">
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <Coins className="w-3 h-3 text-emerald-400" />
                              <span>Saldo a Favor Disponible: S/ {totalFamilyAvailableCredit.toFixed(2)}</span>
                            </span>
                            <label className="flex items-center gap-1 cursor-pointer text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300">
                              <input
                                type="checkbox"
                                checked={applyFamilyCredit}
                                onChange={(e) => setApplyFamilyCredit(e.target.checked)}
                                className="accent-emerald-400"
                              />
                              <span>Aplicar crédito</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lista de Cargos Pendientes para Selección Múltiple */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          Conceptos Pendientes de Cobro ({familyPendingCharges.length})
                        </label>
                        <div className="flex items-center gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              const allSel: Record<string, boolean> = {};
                              familyPendingCharges.forEach((c) => (allSel[c.id] = true));
                              setSelectedChargeIds(allSel);
                            }}
                            className="text-purple-400 hover:text-purple-300 underline cursor-pointer"
                          >
                            Seleccionar Todos
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedChargeIds({})}
                            className="text-slate-500 hover:text-slate-300 underline cursor-pointer"
                          >
                            Deseleccionar
                          </button>
                        </div>
                      </div>

                      {familyPendingCharges.length === 0 ? (
                        <div className="p-4 bg-[#161B22] border border-slate-800 rounded text-center text-slate-400 text-xs">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                          <p className="font-bold text-white">Familia al día</p>
                          <p className="text-[10px] text-slate-500">
                            No registra cargos pendientes de pago en este momento.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {familyPendingCharges.map((chg) => {
                            const isChecked = !!selectedChargeIds[chg.id];
                            const currentAmt = chargePaymentAmounts[chg.id] ?? chg.balance;
                            return (
                              <div
                                key={chg.id}
                                className={`p-2.5 rounded border transition space-y-1.5 ${
                                  isChecked
                                    ? 'bg-purple-950/20 border-purple-500/50'
                                    : 'bg-[#161B22] border-slate-800 opacity-60'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <label className="flex items-start gap-2 cursor-pointer flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) =>
                                        setSelectedChargeIds({
                                          ...selectedChargeIds,
                                          [chg.id]: e.target.checked,
                                        })
                                      }
                                      className="accent-purple-500 mt-0.5"
                                    />
                                    <div>
                                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                        <span>{chg.studentName}</span>
                                        <span className="text-[9px] bg-slate-800 text-purple-300 px-1 py-0.2 rounded border border-purple-500/30">
                                          {chg.chargeType}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {chg.description} • Vence: {chg.dueDate}
                                      </div>
                                    </div>
                                  </label>

                                  <div className="text-right">
                                    <div className="text-[9px] text-slate-500">
                                      Total: S/ {chg.amount.toFixed(2)}
                                    </div>
                                    <div className="font-mono font-bold text-rose-400 text-xs">
                                      Saldo: S/ {chg.balance.toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                {isChecked && (
                                  <div className="flex items-center justify-between pt-1 border-t border-purple-500/20 text-[10px]">
                                    <span className="text-slate-400">Monto a abonar a este cargo:</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-white font-bold">S/</span>
                                      <input
                                        type="number"
                                        step="0.50"
                                        min="1"
                                        max={chg.balance}
                                        value={currentAmt}
                                        onChange={(e) =>
                                          setChargePaymentAmounts({
                                            ...chargePaymentAmounts,
                                            [chg.id]: Number(e.target.value),
                                          })
                                        }
                                        className="w-20 bg-[#0D1117] border border-purple-500/40 rounded px-1.5 py-0.5 text-right text-white font-mono font-bold text-xs"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Cupón Promocional */}
                    <div className="p-2.5 bg-[#161B22] border border-slate-800 rounded space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Código Promocional / Cupón de Descuento
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Ej: HERMANOS, VERANO2026"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          className="flex-1 bg-[#0D1117] border border-slate-700 rounded px-2 py-1 text-white uppercase text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromoCode}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs cursor-pointer"
                        >
                          Aplicar
                        </button>
                      </div>
                      {promoMessage && (
                        <div className="text-[10px] font-semibold text-emerald-400 mt-1">
                          {promoMessage}
                        </div>
                      )}
                    </div>

                    {/* Método de Pago y N° Operación */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                          Medio de Pago
                        </label>
                        <select
                          value={method}
                          onChange={(e) => setMethod(e.target.value as any)}
                          className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
                        >
                          <option value="YAPE">Yape (Móvil)</option>
                          <option value="PLIN">Plin (Móvil)</option>
                          <option value="BANK_TRANSFER">Transferencia BCP</option>
                          <option value="CARD">Tarjeta POS</option>
                          <option value="CASH">Efectivo en Caja</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                          N° de Operación / Constancia
                        </label>
                        <input
                          type="text"
                          required
                          value={refNumber}
                          onChange={(e) => setRefNumber(e.target.value)}
                          className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Selector de Comprobante / Ticket */}
                    <div className="p-3 bg-[#161B22] border border-slate-800 rounded space-y-2">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        Tipo de Comprobante a Emitir
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setVoucherChoice('RECIBO')}
                          className={`py-1.5 px-2 rounded border text-left transition flex items-center gap-1.5 cursor-pointer ${
                            voucherChoice === 'RECIBO'
                              ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 font-bold'
                              : 'border-slate-800 bg-[#0F1219] text-slate-400 hover:text-white'
                          }`}
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-[10px] leading-tight">Recibo Interno</div>
                            <div className="text-[8px] text-slate-500">Serie R001 (Consolidado)</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVoucherChoice('BOLETA')}
                          className={`py-1.5 px-2 rounded border text-left transition flex items-center gap-1.5 cursor-pointer ${
                            voucherChoice === 'BOLETA'
                              ? 'border-sky-500 bg-sky-950/30 text-sky-300 font-bold'
                              : 'border-slate-800 bg-[#0F1219] text-slate-400 hover:text-white'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <div>
                            <div className="text-[10px] leading-tight">Boleta SUNAT</div>
                            <div className="text-[8px] text-slate-500">Serie B001 (Apoderado)</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVoucherChoice('FACTURA')}
                          className={`py-1.5 px-2 rounded border text-left transition flex items-center gap-1.5 cursor-pointer ${
                            voucherChoice === 'FACTURA'
                              ? 'border-purple-500 bg-purple-950/30 text-purple-300 font-bold'
                              : 'border-slate-800 bg-[#0F1219] text-slate-400 hover:text-white'
                          }`}
                        >
                          <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <div>
                            <div className="text-[10px] leading-tight">Factura SUNAT</div>
                            <div className="text-[8px] text-slate-500">Serie F001 (Empresa)</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVoucherChoice('NONE')}
                          className={`py-1.5 px-2 rounded border text-left transition flex items-center gap-1.5 cursor-pointer ${
                            voucherChoice === 'NONE'
                              ? 'border-slate-500 bg-slate-800 text-white font-bold'
                              : 'border-slate-800 bg-[#0F1219] text-slate-400 hover:text-white'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <div className="text-[10px] leading-tight">Solo Caja</div>
                            <div className="text-[8px] text-slate-500">Sin comprobante</div>
                          </div>
                        </button>
                      </div>

                      <div className="text-[9px] text-slate-400 pt-0.5">
                        * El comprobante incluirá el desglose ítem por ítem con cada concepto y el nombre del hijo correspondiente.
                      </div>
                    </div>

                    {/* Resumen de Liquidación Familiar */}
                    <div className="p-3 bg-[#161B22] border border-purple-500/30 rounded space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Cargos Seleccionados ({familySelectedCharges.length}):</span>
                        <span>S/ {familyGrossSubtotal.toFixed(2)}</span>
                      </div>
                      {familyPromoDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400 text-[11px] font-semibold">
                          <span>Descuento Cupón ({appliedPromo?.code}):</span>
                          <span>- S/ {familyPromoDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {familyCreditDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400 text-[11px] font-semibold">
                          <span>Saldo a Favor de Familia Aplicado:</span>
                          <span>- S/ {familyCreditDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white font-bold pt-1.5 border-t border-slate-800 text-sm">
                        <span>Total Neto a Cobrar:</span>
                        <span className="text-emerald-400 font-mono">
                          S/ {familyFinalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={familySelectedCharges.length === 0}
                      className="w-full py-2.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-600/20 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Confirmar Cobro Consolidado Familiar (S/ {familyFinalAmount.toFixed(2)})</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleProcessPayment} className="space-y-3">
                  {/* Tipo de Concepto */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Concepto a Cobrar
                    </label>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleCategoryChange('MONTHLY_FEE')}
                        className={`p-1.5 rounded border text-left cursor-pointer transition ${
                          conceptCategory === 'MONTHLY_FEE'
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-[#161B22] border-slate-800 text-slate-400'
                        }`}
                      >
                        Pensión Mensual
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryChange('PACKAGE')}
                        className={`p-1.5 rounded border text-left cursor-pointer transition ${
                          conceptCategory === 'PACKAGE'
                            ? 'bg-purple-950/40 border-purple-500 text-purple-300 font-bold'
                            : 'bg-[#161B22] border-slate-800 text-slate-400'
                        }`}
                      >
                        Tiquetera / Pack
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryChange('KIT')}
                        className={`p-1.5 rounded border text-left cursor-pointer transition ${
                          conceptCategory === 'KIT'
                            ? 'bg-amber-950/40 border-amber-500 text-amber-300 font-bold'
                            : 'bg-[#161B22] border-slate-800 text-slate-400'
                        }`}
                      >
                        Kit / Uniforme
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryChange('OTHER')}
                        className={`p-1.5 rounded border text-left cursor-pointer transition ${
                          conceptCategory === 'OTHER'
                            ? 'bg-sky-950/40 border-sky-500 text-sky-300 font-bold'
                            : 'bg-[#161B22] border-slate-800 text-slate-400'
                        }`}
                      >
                        Otro Concepto
                      </button>
                    </div>
                  </div>

                  {/* Selector de Paquete cuando aplica */}
                  {conceptCategory === 'PACKAGE' && (
                    <div className="p-2.5 bg-purple-950/20 border border-purple-500/30 rounded space-y-1.5">
                      <label className="text-[10px] text-purple-300 uppercase tracking-wider block font-bold">
                        Seleccionar Tiquetera de Clases
                      </label>
                      <select
                        value={selectedPackageId}
                        onChange={(e) => handlePackageSelect(e.target.value)}
                        className="w-full bg-[#161B22] border border-purple-500/40 rounded p-1.5 text-white text-xs"
                      >
                        {packages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} — S/ {pkg.price.toFixed(2)} ({pkg.classCount} + {pkg.bonusClasses} bonus)
                          </option>
                        ))}
                      </select>
                      <div className="text-[9px] text-slate-400">
                        * Al confirmar el cobro, se habilitará la tiquetera en el perfil del alumno con sus asistencias listas para consumir.
                      </div>
                    </div>
                  )}

                  {/* Alumno */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Seleccionar Alumno
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
                    >
                      {students.map((stu) => {
                        const tag =
                          stu.scholarshipType === 'FULL_SCHOLARSHIP'
                            ? ' [BECA 100%]'
                            : stu.scholarshipType === 'HALF_SCHOLARSHIP'
                            ? ' [SEMIBECA 50%]'
                            : stu.scholarshipType === 'SIBLING_DISCOUNT'
                            ? ' [DESC. HERMANO]'
                            : stu.scholarshipType === 'CUSTOM_DISCOUNT'
                            ? ' [CONVENIO]'
                            : '';
                        return (
                          <option key={stu.id} value={stu.id}>
                            {stu.name}
                            {tag} {stu.balance > 0 ? `(Debe S/ ${stu.balance.toFixed(2)})` : '(Al día)'}
                          </option>
                        );
                      })}
                    </select>

                    {currentStudent && currentStudent.scholarshipType && currentStudent.scholarshipType !== 'NONE' && (
                      <div className="mt-2 p-2 bg-purple-950/20 border border-purple-500/30 rounded text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-300 font-bold flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-purple-400" />
                            {currentStudent.scholarshipType === 'FULL_SCHOLARSHIP' && 'Beca Integral 100% Exonerado'}
                            {currentStudent.scholarshipType === 'HALF_SCHOLARSHIP' && 'Semibeca 50% de Descuento'}
                            {currentStudent.scholarshipType === 'SIBLING_DISCOUNT' && `Descuento Hermanos (-${currentStudent.scholarshipDiscountPct || 15}%)`}
                            {currentStudent.scholarshipType === 'CUSTOM_DISCOUNT' && 'Convenio Especial'}
                          </span>
                          <span className="text-slate-400">
                            Base: <span className="line-through">S/ {currentStudent.monthlyFee.toFixed(2)}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{currentStudent.scholarshipReason || 'Beneficio formativo registrado'}</span>
                          <span className="text-emerald-400 font-bold">
                            Cuota neta: S/ {(currentStudent.finalMonthlyFee ?? 0).toFixed(2)}/mes
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Detección de Saldo a Favor de la Familia */}
                    {totalFamilyCredit > 0 && (
                      <div className="mt-2 p-2.5 bg-emerald-950/30 border border-emerald-500/40 rounded space-y-1.5">
                        <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px]">
                          <span className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Saldo a Favor de Familia: S/ {totalFamilyCredit.toFixed(2)}</span>
                          </span>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-400/50">
                            <input
                              type="checkbox"
                              checked={applyFamilyCredit}
                              onChange={(e) => setApplyFamilyCredit(e.target.checked)}
                              className="accent-emerald-400"
                            />
                            <span>Aplicar a este cobro</span>
                          </label>
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Motivo: {availableFamilyCredits[0]?.reason}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cupón Promocional */}
                  <div className="p-2.5 bg-[#161B22] border border-slate-800 rounded space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Código Promocional / Cupón de Descuento
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ej: VERANO2026, HERMANOS"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-[#0D1117] border border-slate-700 rounded px-2 py-1 text-white uppercase text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromoCode}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                    {promoMessage && (
                      <div className="text-[10px] font-semibold text-emerald-400 mt-1">
                        {promoMessage}
                      </div>
                    )}
                  </div>

                  {/* Importe y Método */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                        Importe Base (PEN)
                      </label>
                      <input
                        type="number"
                        step="0.10"
                        required
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                        Medio de Pago
                      </label>
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
                      >
                        <option value="YAPE">Yape (Móvil)</option>
                        <option value="PLIN">Plin (Móvil)</option>
                        <option value="BANK_TRANSFER">Transferencia BCP</option>
                        <option value="CARD">Tarjeta POS</option>
                        <option value="CASH">Efectivo en Caja</option>
                      </select>
                    </div>
                  </div>

                  {/* Resumen de Liquidación */}
                  {(promoDiscount > 0 || creditDiscount > 0) && (
                    <div className="p-2.5 bg-[#161B22] border border-emerald-500/30 rounded space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Importe Base:</span>
                        <span>S/ {amount.toFixed(2)}</span>
                      </div>
                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400 font-semibold">
                          <span>Descuento Promoción ({appliedPromo?.code}):</span>
                          <span>- S/ {promoDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {creditDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400 font-semibold">
                          <span>Saldo a Favor de Familia aplicado:</span>
                          <span>- S/ {creditDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800 text-xs">
                        <span>Total Neto a Cobrar:</span>
                        <span className="text-emerald-400">S/ {finalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Número de Operación */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      N° de Operación / Constancia
                    </label>
                    <input
                      type="text"
                      required
                      value={refNumber}
                      onChange={(e) => setRefNumber(e.target.value)}
                      className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>

                  {/* Concepto */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Descripción / Concepto
                    </label>
                    <input
                      type="text"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#161B22] border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
                    />
                  </div>

                  {/* Selector de Comprobante / Constancia: Recibo vs Boleta vs Factura vs Ninguno */}
                  <div className="p-3 bg-[#161B22] border border-slate-800 rounded space-y-2">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Tipo de Comprobante a Entregar
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVoucherChoice('RECIBO')}
                        className={`py-1.5 px-2 rounded border text-left transition flex items-center gap-1.5 cursor-pointer ${
                          voucherChoice === 'RECIBO'
                            ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 font-bold'
                            : 'border-slate-800 bg-[#0F1219] text-slate-400 hover:text-white'
                        }`}
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-[10px] leading-tight">Recibo Interno</div>
                          <div className="text-[8px] text-slate-500">Serie R001 (Sin SUNAT)</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoucherChoice('BOLETA')}
                        className={`py-1.5 px-2 rounded border text-left transition flex items-center gap-1.5 cursor-pointer ${
                          voucherChoice === 'BOLETA'
                            ? 'border-sky-500 bg-sky-950/30 text-sky-300 font-bold'
                            : 'border-slate-800 bg-[#0F1219] text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <div>
                          <div className="text-[10px] leading-tight">Boleta SUNAT</div>
                          <div className="text-[8px] text-slate-500">Serie B001 (DNI)</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoucherChoice('FACTURA')}
                        className={`py-1.5 px-2 rounded border text-left transition flex items-center gap-1.5 cursor-pointer ${
                          voucherChoice === 'FACTURA'
                            ? 'border-purple-500 bg-purple-950/30 text-purple-300 font-bold'
                            : 'border-slate-800 bg-[#0F1219] text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <div>
                          <div className="text-[10px] leading-tight">Factura SUNAT</div>
                          <div className="text-[8px] text-slate-500">Serie F001 (RUC)</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoucherChoice('NONE')}
                        className={`py-1.5 px-2 rounded border text-left transition flex items-center gap-1.5 cursor-pointer ${
                          voucherChoice === 'NONE'
                            ? 'border-slate-500 bg-slate-800 text-white font-bold'
                            : 'border-slate-800 bg-[#0F1219] text-slate-400 hover:text-white'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <div className="text-[10px] leading-tight">Solo Caja</div>
                          <div className="text-[8px] text-slate-500">Sin comprobante</div>
                        </div>
                      </button>
                    </div>

                    <div className="text-[9px] text-slate-500 pt-1">
                      {voucherChoice === 'RECIBO' && (
                        <span className="text-emerald-400/90">
                          * Emite constancia interna de pago para entregar al padre por WhatsApp o ticket térmico sin declarar ante SUNAT.
                        </span>
                      )}
                      {voucherChoice === 'BOLETA' && (
                        <span className="text-sky-400/90">
                          * Genera Boleta Electrónica con DNI del apoderado y validación de CDR oficial de SUNAT.
                        </span>
                      )}
                      {voucherChoice === 'FACTURA' && (
                        <span className="text-purple-400/90">
                          * Genera Factura Electrónica con RUC de 11 dígitos para empresas o sponsors.
                        </span>
                      )}
                      {voucherChoice === 'NONE' && (
                        <span className="text-slate-400">
                          * Solo registra el ingreso en el balance de caja sin generar constancia física ni electrónica.
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Confirmar y Procesar Cobro (S/ {finalAmount.toFixed(2)})</span>
                  </button>
                </form>
                )}
              </div>
            </div>

            {/* Right (7 cols): Payments Ledger Table */}
            <div className="lg:col-span-7 space-y-3">
              <div className="bg-[#0F1219] border border-slate-800 rounded p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Registro Histórico de Pagos de Hoy ({payments.length})
                  </span>

                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Filtrar por alumno, op, serie..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      className="bg-[#161B22] border border-slate-800 rounded pl-6 pr-2 py-1 text-[10px] text-slate-300 w-52"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredPayments.map((pay) => {
                    const isRecibo = pay.invoiceType === 'RECIBO' || pay.invoiceNumber?.startsWith('R');
                    const isFactura = pay.invoiceType === 'FACTURA' || pay.invoiceNumber?.startsWith('F');
                    const isBoleta = pay.invoiceType === 'BOLETA' || pay.invoiceNumber?.startsWith('B');

                    return (
                      <div
                        key={pay.id}
                        className="p-3 bg-[#161B22] border border-slate-800 rounded hover:border-slate-700 transition space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-xs">
                                {pay.studentName}
                              </span>
                              <span className="text-[9px] bg-slate-800 text-sky-400 px-1.5 py-0.2 rounded font-bold">
                                {pay.paymentMethod}
                              </span>
                              {isRecibo && pay.invoiceNumber && (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                                  <Receipt className="w-2.5 h-2.5" />
                                  <span>RECIBO {pay.invoiceNumber}</span>
                                </span>
                              )}
                              {isBoleta && pay.invoiceNumber && (
                                <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                                  <FileCheck className="w-2.5 h-2.5" />
                                  <span>BOLETA {pay.invoiceNumber}</span>
                                </span>
                              )}
                              {isFactura && pay.invoiceNumber && (
                                <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                                  <Building className="w-2.5 h-2.5" />
                                  <span>FACTURA {pay.invoiceNumber}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {pay.description} • Ref: <span className="text-slate-300 font-mono">{pay.referenceNumber}</span>
                            </div>

                            {/* Desglose de Distribución / Allocations si es Cobro Consolidado */}
                            {pay.allocations && pay.allocations.length > 0 && (
                              <div className="mt-2 bg-[#0D1117] p-2 rounded border border-purple-500/30 space-y-1.5">
                                <div className="text-[10px] font-bold text-purple-300 flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <Layers className="w-3 h-3 text-purple-400" />
                                    <span>Cobro Consolidado ({pay.allocations.length} conceptos distribuidos):</span>
                                  </span>
                                  {pay.familyName && (
                                    <span className="text-[9px] text-purple-400 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-500/40 font-mono">
                                      {pay.familyName}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1 pt-0.5">
                                  {pay.allocations.map((alc) => (
                                    <div
                                      key={alc.id}
                                      className="flex justify-between items-center text-[10px] bg-[#161B22] px-2 py-1 rounded border border-slate-800"
                                    >
                                      <span className="text-slate-300 truncate max-w-[260px]">
                                        <strong className="text-white">{alc.studentName}</strong> • {alc.chargeDescription}
                                      </span>
                                      <span className="font-mono font-bold text-emerald-400 shrink-0 ml-2">
                                        S/ {alc.amount.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-emerald-400 text-sm">
                              S/ {pay.amount.toFixed(2)}
                            </div>
                            <div className="text-[9px] text-slate-500">{pay.paidAt}</div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] flex-wrap gap-2">
                          <span className="text-slate-500">Cajero: {pay.receivedBy}</span>

                          <div className="flex items-center gap-2">
                            {/* Botón de Devolución / Reembolso */}
                            <button
                              onClick={() => setPaymentToRefund(pay)}
                              className="text-rose-400 hover:text-white font-bold flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900/50 px-2 py-0.5 rounded border border-rose-500/40 transition cursor-pointer"
                              title="Registrar devolución o reembolso parcial/total"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Devolución</span>
                            </button>

                            {pay.invoiceNumber ? (
                              <button
                                onClick={() => handleOpenTicketForPayment(pay)}
                                className="text-sky-400 hover:text-white font-bold flex items-center gap-1 bg-slate-800/70 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700 transition cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Ver / Imprimir Ticket</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setRetroPayment(pay)}
                                className="text-emerald-400 hover:text-white font-bold flex items-center gap-1 bg-emerald-950/40 hover:bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-500/40 transition cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Emitir Recibo o Boleta</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal para Devolución / Reembolso */}
      <RefundModal
        payment={paymentToRefund}
        onClose={() => setPaymentToRefund(null)}
        onConfirmRefund={(refund, payId) => {
          onAddRefund(refund, payId);
          setPaymentSuccess(`Devolución de S/ ${refund.amount.toFixed(2)} registrada exitosamente.`);
          setTimeout(() => setPaymentSuccess(null), 4000);
        }}
      />

      {/* Modal para emisión retroactiva en pago existente */}
      {retroPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1219] border border-slate-700 text-slate-200 max-w-sm w-full p-5 rounded-lg shadow-2xl space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs uppercase">
                Emitir Comprobante para Pago Existente
              </span>
              <button
                onClick={() => setRetroPayment(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] bg-[#161B22] p-2.5 rounded border border-slate-800 space-y-1">
              <div><strong>Alumno:</strong> {retroPayment.studentName}</div>
              <div><strong>Concepto:</strong> {retroPayment.description}</div>
              <div className="text-emerald-400 font-bold">
                Monto: S/ {retroPayment.amount.toFixed(2)}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Selecciona Tipo de Comprobante
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 p-2 bg-[#161B22] border border-slate-800 rounded cursor-pointer hover:border-emerald-500/50">
                  <input
                    type="radio"
                    name="retroType"
                    checked={retroType === 'RECIBO'}
                    onChange={() => setRetroType('RECIBO')}
                    className="accent-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-emerald-300">Recibo de Caja Interno (R001)</div>
                    <div className="text-[9px] text-slate-500">Control interno sin SUNAT</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#161B22] border border-slate-800 rounded cursor-pointer hover:border-sky-500/50">
                  <input
                    type="radio"
                    name="retroType"
                    checked={retroType === 'BOLETA'}
                    onChange={() => setRetroType('BOLETA')}
                    className="accent-sky-500"
                  />
                  <div>
                    <div className="font-bold text-sky-300">Boleta Electrónica (B001)</div>
                    <div className="text-[9px] text-slate-500">SUNAT con DNI</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#161B22] border border-slate-800 rounded cursor-pointer hover:border-purple-500/50">
                  <input
                    type="radio"
                    name="retroType"
                    checked={retroType === 'FACTURA'}
                    onChange={() => setRetroType('FACTURA')}
                    className="accent-purple-500"
                  />
                  <div>
                    <div className="font-bold text-purple-300">Factura Electrónica (F001)</div>
                    <div className="text-[9px] text-slate-500">SUNAT con RUC</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRetroPayment(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRetroEmit}
                className="px-3.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded cursor-pointer"
              >
                Confirmar Emisión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal Reutilizable */}
      <VoucherTicketModal
        invoice={ticketToView}
        academyName={academyProfile?.name}
        onClose={() => setTicketToView(null)}
      />
    </div>
  );
};
