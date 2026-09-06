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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Caja, Cobranzas & Comprobantes
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Gestión de pensiones, tiqueteras, saldos a favor y emisión de comprobantes autorizados.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-5 py-3 text-right">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Total Cobrado Hoy</div>
          <div className="text-2xl font-bold text-emerald-700">
            S/ {grandTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveSubTab('CASHIER')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'CASHIER'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Caja & Cobranzas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CLOSING')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'CLOSING'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Cierre & Arqueo Z</span>
        </button>

        <button
          onClick={() => setActiveSubTab('REMINDERS')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'REMINDERS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Cobranza WhatsApp</span>
          {students.filter((s) => s.balance > 0).length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'REMINDERS' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
            }`}>
              {students.filter((s) => s.balance > 0).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('CREDITS')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'CREDITS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Saldos a Favor</span>
          {customerCredits.filter((c) => c.status === 'AVAILABLE' && c.remaining > 0).length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'CREDITS' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {customerCredits.filter((c) => c.status === 'AVAILABLE' && c.remaining > 0).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('PACKAGES')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'PACKAGES'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Tiqueteras</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeSubTab === 'PACKAGES' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
          }`}>
            {packageCredits.filter((p) => p.status === 'ACTIVE').length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('TRIALS')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'TRIALS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clases de Prueba</span>
          {trials.filter((t) => !t.converted).length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeSubTab === 'TRIALS' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
            }`}>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>Yape</span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                S/ {yapeTotal.toFixed(2)}
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span>Plin</span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                S/ {plinTotal.toFixed(2)}
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Building className="w-3.5 h-3.5 text-amber-600" />
                <span>BCP / Transf.</span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                S/ {bankTotal.toFixed(2)}
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>POS / Efectivo</span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                S/ {cardCashTotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Immediate Success Banner after payment */}
          {paymentSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-900 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{paymentSuccess}</span>
              </div>
              {lastCreatedTicket && (
                <button
                  onClick={() => setTicketToView(lastCreatedTicket)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition shrink-0 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Ver Ticket</span>
                </button>
              )}
            </div>
          )}

          {/* Main Grid: Form Left (5 cols) & Ledger Right (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left (5 cols): Payment Registration Form */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Registrar Cobro</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    Cajero: Mateo Paredes
                  </span>
                </div>

                {/* Selector de Modo: Cobro Individual vs Consolidado Familiar */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs">
                  <button
                    type="button"
                    onClick={() => setCheckoutMode('SINGLE_STUDENT')}
                    className={`py-2 px-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                      checkoutMode === 'SINGLE_STUDENT'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Individual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutMode('FAMILY_CONSOLIDATED')}
                    className={`py-2 px-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                      checkoutMode === 'FAMILY_CONSOLIDATED'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Familiar</span>
                  </button>
                </div>

                {checkoutMode === 'FAMILY_CONSOLIDATED' ? (
                  <form onSubmit={handleProcessFamilyPayment} className="space-y-4">
                    {/* Selector de Familia */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-purple-600" />
                          <span>Familia</span>
                        </label>
                        <span className="text-xs text-slate-400">
                          {families.length} familias
                        </span>
                      </div>
                      <select
                        value={selectedFamilyId}
                        onChange={(e) => setSelectedFamilyId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:border-purple-500"
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
                      <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              <span>{currentFamily.name}</span>
                              {currentFamily.billingPreference && (
                                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                                  {currentFamily.billingPreference}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              {currentFamily.contacts[0] ? (
                                <span>
                                  Apoderado: <strong className="text-slate-800">{currentFamily.contacts[0].fullName}</strong> ({currentFamily.contacts[0].relationship}) • Doc: {currentFamily.contacts[0].documentNumber || '—'}
                                </span>
                              ) : (
                                <span>Sin apoderado principal</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-500">Deuda Familia</div>
                            <div className="font-bold text-rose-600 text-sm">
                              S/ {familyPendingCharges.reduce((s, c) => s + c.balance, 0).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Hermanos Inscritos */}
                        <div className="pt-2 border-t border-purple-200/60 flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-purple-900 font-semibold">Hijos:</span>
                          {students
                            .filter((s) => s.familyId === currentFamily.id)
                            .map((st) => (
                              <span
                                key={st.id}
                                className="text-xs bg-white border border-purple-200/80 text-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
                              >
                                <span>{st.name}</span>
                                <span className="text-[10px] text-purple-600 font-semibold">({st.sport})</span>
                              </span>
                            ))}
                        </div>

                        {/* Saldo a Favor de la Familia disponible */}
                        {totalFamilyAvailableCredit > 0 && (
                          <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between">
                            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Saldo a Favor: S/ {totalFamilyAvailableCredit.toFixed(2)}</span>
                            </span>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs bg-emerald-100 px-2.5 py-0.5 rounded-lg text-emerald-800 font-semibold">
                              <input
                                type="checkbox"
                                checked={applyFamilyCredit}
                                onChange={(e) => setApplyFamilyCredit(e.target.checked)}
                                className="accent-emerald-600 rounded"
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
                        <label className="text-xs font-semibold text-slate-700">
                          Pendientes de Cobro ({familyPendingCharges.length})
                        </label>
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              const allSel: Record<string, boolean> = {};
                              familyPendingCharges.forEach((c) => (allSel[c.id] = true));
                              setSelectedChargeIds(allSel);
                            }}
                            className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
                          >
                            Seleccionar Todos
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedChargeIds({})}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Deseleccionar
                          </button>
                        </div>
                      </div>

                      {familyPendingCharges.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                          <p className="font-semibold text-slate-800">Familia al día</p>
                          <p className="text-xs text-slate-400">
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
                                className={`p-2.5 rounded-xl border transition space-y-1.5 ${
                                  isChecked
                                    ? 'bg-purple-50/60 border-purple-300'
                                    : 'bg-slate-50/60 border-slate-200 opacity-75'
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
                                      className="accent-purple-600 rounded mt-0.5"
                                    />
                                    <div>
                                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                        <span>{chg.studentName}</span>
                                        <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-semibold">
                                          {chg.chargeType}
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-500 mt-0.5">
                                        {chg.description} • Vence: {chg.dueDate}
                                      </div>
                                    </div>
                                  </label>

                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-400">
                                      Total: S/ {chg.amount.toFixed(2)}
                                    </div>
                                    <div className="font-bold text-rose-600 text-xs">
                                      Saldo: S/ {chg.balance.toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                {isChecked && (
                                  <div className="flex items-center justify-between pt-1.5 border-t border-purple-200/60 text-xs">
                                    <span className="text-slate-600">Monto a abonar:</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-700 font-bold">S/</span>
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
                                        className="w-20 bg-white border border-purple-300 rounded-lg px-2 py-0.5 text-right text-slate-900 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Cupón de Descuento
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Ej: HERMANOS, VERANO2026"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 uppercase text-xs focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromoCode}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold text-xs cursor-pointer transition"
                        >
                          Aplicar
                        </button>
                      </div>
                      {promoMessage && (
                        <div className="text-xs font-medium text-emerald-700 mt-1">
                          {promoMessage}
                        </div>
                      )}
                    </div>

                    {/* Método de Pago y N° Operación */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Medio de Pago
                        </label>
                        <select
                          value={method}
                          onChange={(e) => setMethod(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="YAPE">Yape (Móvil)</option>
                          <option value="PLIN">Plin (Móvil)</option>
                          <option value="BANK_TRANSFER">Transferencia BCP</option>
                          <option value="CARD">Tarjeta POS</option>
                          <option value="CASH">Efectivo en Caja</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          N° Constancia / Op
                        </label>
                        <input
                          type="text"
                          required
                          value={refNumber}
                          onChange={(e) => setRefNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Selector de Comprobante / Ticket */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="text-xs font-semibold text-slate-700">
                        Tipo de Comprobante a Emitir
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setVoucherChoice('RECIBO')}
                          className={`py-2 px-2.5 rounded-xl border text-left transition flex items-center gap-1.5 cursor-pointer ${
                            voucherChoice === 'RECIBO'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Recibo Interno</div>
                            <div className="text-[10px] text-slate-500">Serie R001</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVoucherChoice('BOLETA')}
                          className={`py-2 px-2.5 rounded-xl border text-left transition flex items-center gap-1.5 cursor-pointer ${
                            voucherChoice === 'BOLETA'
                              ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Boleta SUNAT</div>
                            <div className="text-[10px] text-slate-500">Serie B001</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVoucherChoice('FACTURA')}
                          className={`py-2 px-2.5 rounded-xl border text-left transition flex items-center gap-1.5 cursor-pointer ${
                            voucherChoice === 'FACTURA'
                              ? 'border-purple-500 bg-purple-50 text-purple-900 font-bold shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Factura SUNAT</div>
                            <div className="text-[10px] text-slate-500">Serie F001</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVoucherChoice('NONE')}
                          className={`py-2 px-2.5 rounded-xl border text-left transition flex items-center gap-1.5 cursor-pointer ${
                            voucherChoice === 'NONE'
                              ? 'border-slate-400 bg-slate-200 text-slate-900 font-bold shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Solo Caja</div>
                            <div className="text-[10px] text-slate-500">Sin comprobante</div>
                          </div>
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 pt-0.5">
                        * El comprobante incluirá el desglose ítem por ítem con cada concepto y el nombre del alumno correspondiente.
                      </div>
                    </div>

                    {/* Resumen de Liquidación Familiar */}
                    <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Cargos Seleccionados ({familySelectedCharges.length}):</span>
                        <span className="font-semibold text-slate-800">S/ {familyGrossSubtotal.toFixed(2)}</span>
                      </div>
                      {familyPromoDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Descuento Cupón ({appliedPromo?.code}):</span>
                          <span>- S/ {familyPromoDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {familyCreditDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Saldo a Favor de Familia:</span>
                          <span>- S/ {familyCreditDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-purple-200 text-sm">
                        <span>Total Neto a Cobrar:</span>
                        <span className="text-purple-700 font-bold text-base">
                          S/ {familyFinalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={familySelectedCharges.length === 0}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Confirmar Cobro Familiar (S/ {familyFinalAmount.toFixed(2)})</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleProcessPayment} className="space-y-4">
                  {/* Tipo de Concepto */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Concepto a Cobrar
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleCategoryChange('MONTHLY_FEE')}
                        className={`p-2.5 rounded-xl border text-center font-medium cursor-pointer transition ${
                          conceptCategory === 'MONTHLY_FEE'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Pensión
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryChange('PACKAGE')}
                        className={`p-2.5 rounded-xl border text-center font-medium cursor-pointer transition ${
                          conceptCategory === 'PACKAGE'
                            ? 'bg-purple-50 border-purple-500 text-purple-900 font-semibold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Tiquetera
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryChange('KIT')}
                        className={`p-2.5 rounded-xl border text-center font-medium cursor-pointer transition ${
                          conceptCategory === 'KIT'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 font-semibold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Uniforme
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryChange('OTHER')}
                        className={`p-2.5 rounded-xl border text-center font-medium cursor-pointer transition ${
                          conceptCategory === 'OTHER'
                            ? 'bg-sky-50 border-sky-500 text-sky-900 font-semibold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Otro
                      </button>
                    </div>
                  </div>

                  {/* Selector de Paquete cuando aplica */}
                  {conceptCategory === 'PACKAGE' && (
                    <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-2">
                      <label className="text-xs font-semibold text-purple-900 block">
                        Tiquetera de Clases
                      </label>
                      <select
                        value={selectedPackageId}
                        onChange={(e) => handlePackageSelect(e.target.value)}
                        className="w-full bg-white border border-purple-200 rounded-xl p-2 text-slate-900 text-xs focus:outline-none focus:border-purple-500"
                      >
                        {packages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} — S/ {pkg.price.toFixed(2)} ({pkg.classCount} + {pkg.bonusClasses} bonus)
                          </option>
                        ))}
                      </select>
                      <div className="text-[11px] text-slate-500">
                        * Al confirmar el cobro, se habilitará la tiquetera en el perfil del alumno con sus asistencias listas.
                      </div>
                    </div>
                  )}

                  {/* Alumno */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Alumno
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
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
                      <div className="mt-2.5 p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-900 font-semibold flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-purple-600" />
                            {currentStudent.scholarshipType === 'FULL_SCHOLARSHIP' && 'Beca Integral 100% Exonerado'}
                            {currentStudent.scholarshipType === 'HALF_SCHOLARSHIP' && 'Semibeca 50% de Descuento'}
                            {currentStudent.scholarshipType === 'SIBLING_DISCOUNT' && `Descuento Hermanos (-${currentStudent.scholarshipDiscountPct || 15}%)`}
                            {currentStudent.scholarshipType === 'CUSTOM_DISCOUNT' && 'Convenio Especial'}
                          </span>
                          <span className="text-slate-500">
                            Base: <span className="line-through">S/ {currentStudent.monthlyFee.toFixed(2)}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>{currentStudent.scholarshipReason || 'Beneficio formativo registrado'}</span>
                          <span className="text-emerald-700 font-semibold">
                            Cuota neta: S/ {(currentStudent.finalMonthlyFee ?? 0).toFixed(2)}/mes
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Detección de Saldo a Favor de la Familia */}
                    {totalFamilyCredit > 0 && (
                      <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-emerald-900 font-semibold text-xs">
                          <span className="flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Saldo a Favor Familiar: S/ {totalFamilyCredit.toFixed(2)}</span>
                          </span>
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs bg-emerald-100 px-2.5 py-0.5 rounded-lg text-emerald-800 font-medium">
                            <input
                              type="checkbox"
                              checked={applyFamilyCredit}
                              onChange={(e) => setApplyFamilyCredit(e.target.checked)}
                              className="accent-emerald-600 rounded"
                            />
                            <span>Aplicar</span>
                          </label>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Motivo: {availableFamilyCredits[0]?.reason}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cupón Promocional */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Cupón de Descuento
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ej: VERANO2026, HERMANOS"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 uppercase text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromoCode}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold text-xs cursor-pointer transition"
                      >
                        Aplicar
                      </button>
                    </div>
                    {promoMessage && (
                      <div className="text-xs font-medium text-emerald-700 mt-1">
                        {promoMessage}
                      </div>
                    )}
                  </div>

                  {/* Importe y Método */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Importe Base (PEN)
                      </label>
                      <input
                        type="number"
                        step="0.10"
                        required
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Medio de Pago
                      </label>
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
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
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Importe Base:</span>
                        <span>S/ {amount.toFixed(2)}</span>
                      </div>
                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Descuento Promoción ({appliedPromo?.code}):</span>
                          <span>- S/ {promoDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {creditDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Saldo a Favor de Familia aplicado:</span>
                          <span>- S/ {creditDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-emerald-200 text-xs">
                        <span>Total Neto a Cobrar:</span>
                        <span className="text-emerald-700 font-bold text-sm">S/ {finalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Número de Operación */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      N° de Operación / Constancia
                    </label>
                    <input
                      type="text"
                      required
                      value={refNumber}
                      onChange={(e) => setRefNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Concepto */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Descripción / Concepto
                    </label>
                    <input
                      type="text"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Selector de Comprobante / Constancia */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="text-xs font-semibold text-slate-700">
                      Tipo de Comprobante a Entregar
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVoucherChoice('RECIBO')}
                        className={`py-2 px-2.5 rounded-xl border text-left transition flex items-center gap-1.5 cursor-pointer ${
                          voucherChoice === 'RECIBO'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold leading-tight">Recibo Interno</div>
                          <div className="text-[10px] text-slate-500">Serie R001</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoucherChoice('BOLETA')}
                        className={`py-2 px-2.5 rounded-xl border text-left transition flex items-center gap-1.5 cursor-pointer ${
                          voucherChoice === 'BOLETA'
                            ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <FileCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold leading-tight">Boleta SUNAT</div>
                          <div className="text-[10px] text-slate-500">Serie B001</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoucherChoice('FACTURA')}
                        className={`py-2 px-2.5 rounded-xl border text-left transition flex items-center gap-1.5 cursor-pointer ${
                          voucherChoice === 'FACTURA'
                            ? 'border-purple-500 bg-purple-50 text-purple-900 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold leading-tight">Factura SUNAT</div>
                          <div className="text-[10px] text-slate-500">Serie F001</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoucherChoice('NONE')}
                        className={`py-2 px-2.5 rounded-xl border text-left transition flex items-center gap-1.5 cursor-pointer ${
                          voucherChoice === 'NONE'
                            ? 'border-slate-400 bg-slate-200 text-slate-900 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold leading-tight">Solo Caja</div>
                          <div className="text-[10px] text-slate-500">Sin comprobante</div>
                        </div>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-0.5">
                      {voucherChoice === 'RECIBO' && (
                        <span className="text-emerald-700">
                          * Emite constancia interna de pago para entregar al apoderado por WhatsApp o ticket térmico.
                        </span>
                      )}
                      {voucherChoice === 'BOLETA' && (
                        <span className="text-blue-700">
                          * Genera Boleta Electrónica con DNI del apoderado y validación oficial de SUNAT.
                        </span>
                      )}
                      {voucherChoice === 'FACTURA' && (
                        <span className="text-purple-700">
                          * Genera Factura Electrónica con RUC de 11 dígitos para empresas o sponsors.
                        </span>
                      )}
                      {voucherChoice === 'NONE' && (
                        <span className="text-slate-500">
                          * Solo registra el ingreso en el balance de caja sin generar constancia física ni electrónica.
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Confirmar Cobro (S/ {finalAmount.toFixed(2)})</span>
                  </button>
                </form>
                )}
              </div>
            </div>

            {/* Right (7 cols): Payments Ledger Table */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Historial de Pagos de Hoy
                    </h3>
                    <p className="text-xs text-slate-400">
                      {payments.length} transacciones registradas
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filtrar por alumno, op, serie..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 w-56 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {filteredPayments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No hay pagos registrados que coincidan con la búsqueda.
                    </div>
                  ) : (
                    filteredPayments.map((pay) => {
                      const isRecibo = pay.invoiceType === 'RECIBO' || pay.invoiceNumber?.startsWith('R');
                      const isFactura = pay.invoiceType === 'FACTURA' || pay.invoiceNumber?.startsWith('F');
                      const isBoleta = pay.invoiceType === 'BOLETA' || pay.invoiceNumber?.startsWith('B');

                      return (
                        <div
                          key={pay.id}
                          className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl hover:bg-slate-50 transition space-y-2.5"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs">
                                  {pay.studentName}
                                </span>
                                <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                                  {pay.paymentMethod}
                                </span>
                                {isRecibo && pay.invoiceNumber && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                    <Receipt className="w-3 h-3" />
                                    <span>RECIBO {pay.invoiceNumber}</span>
                                  </span>
                                )}
                                {isBoleta && pay.invoiceNumber && (
                                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                    <FileCheck className="w-3 h-3" />
                                    <span>BOLETA {pay.invoiceNumber}</span>
                                  </span>
                                )}
                                {isFactura && pay.invoiceNumber && (
                                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    <span>FACTURA {pay.invoiceNumber}</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {pay.description} • Ref: <span className="text-slate-800 font-mono font-medium">{pay.referenceNumber}</span>
                              </div>

                              {/* Desglose de Distribución / Allocations si es Cobro Consolidado */}
                              {pay.allocations && pay.allocations.length > 0 && (
                                <div className="mt-2.5 bg-purple-50/70 p-2.5 rounded-xl border border-purple-200/80 space-y-1.5">
                                  <div className="text-xs font-semibold text-purple-900 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                                      <span>Cobro Consolidado ({pay.allocations.length} conceptos):</span>
                                    </span>
                                    {pay.familyName && (
                                      <span className="text-[10px] text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200 font-medium">
                                        {pay.familyName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1 pt-1">
                                    {pay.allocations.map((alc) => (
                                      <div
                                        key={alc.id}
                                        className="flex justify-between items-center text-xs bg-white px-2.5 py-1 rounded-lg border border-purple-100"
                                      >
                                        <span className="text-slate-700 truncate max-w-[260px]">
                                          <strong className="text-slate-900">{alc.studentName}</strong> • {alc.chargeDescription}
                                        </span>
                                        <span className="font-semibold text-emerald-700 shrink-0 ml-2">
                                          S/ {alc.amount.toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-slate-900 text-sm">
                                S/ {pay.amount.toFixed(2)}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{pay.paidAt}</div>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs flex-wrap gap-2">
                            <span className="text-slate-400">Cajero: {pay.receivedBy}</span>

                            <div className="flex items-center gap-2">
                              {/* Botón de Devolución / Reembolso */}
                              <button
                                onClick={() => setPaymentToRefund(pay)}
                                className="text-rose-700 hover:text-rose-800 font-medium flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer"
                                title="Registrar devolución o reembolso parcial/total"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Devolución</span>
                              </button>

                              {pay.invoiceNumber ? (
                                <button
                                  onClick={() => handleOpenTicketForPayment(pay)}
                                  className="text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer shadow-xs"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Ver Ticket</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setRetroPayment(pay)}
                                  className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Emitir Comprobante</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-800 max-w-sm w-full p-5 rounded-3xl shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">
                Emitir Comprobante
              </h3>
              <button
                onClick={() => setRetroPayment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
              <div><strong className="text-slate-700">Alumno:</strong> {retroPayment.studentName}</div>
              <div><strong className="text-slate-700">Concepto:</strong> {retroPayment.description}</div>
              <div className="text-emerald-700 font-bold pt-1">
                Monto: S/ {retroPayment.amount.toFixed(2)}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Selecciona Tipo de Comprobante
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-500 transition">
                  <input
                    type="radio"
                    name="retroType"
                    checked={retroType === 'RECIBO'}
                    onChange={() => setRetroType('RECIBO')}
                    className="accent-emerald-600"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">Recibo Interno (R001)</div>
                    <div className="text-[11px] text-slate-500">Control administrativo interno</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="radio"
                    name="retroType"
                    checked={retroType === 'BOLETA'}
                    onChange={() => setRetroType('BOLETA')}
                    className="accent-blue-600"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">Boleta Electrónica (B001)</div>
                    <div className="text-[11px] text-slate-500">SUNAT con DNI</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-purple-500 transition">
                  <input
                    type="radio"
                    name="retroType"
                    checked={retroType === 'FACTURA'}
                    onChange={() => setRetroType('FACTURA')}
                    className="accent-purple-600"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">Factura Electrónica (F001)</div>
                    <div className="text-[11px] text-slate-500">SUNAT con RUC</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRetroPayment(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRetroEmit}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer transition shadow-xs"
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
