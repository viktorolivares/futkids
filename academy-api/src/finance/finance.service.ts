import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateChargeDto,
  CreatePaymentDto,
  CreateRefundDto,
} from './dto/finance.dto';
import { Prisma, PaymentMethod, ChargeStatus, ChargeType } from '@prisma/client';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // CARGOS (CHARGES)
  // ==========================================
  async getCharges(academyId: string) {
    const charges = await this.prisma.charge.findMany({
      where: { academyId },
      include: {
        student: true,
        family: true,
        allocations: true,
      },
      orderBy: { dueDate: 'desc' },
    });

    return charges.map((c) => ({
      id: c.id,
      academyId: c.academyId,
      studentId: c.studentId || '',
      studentName: c.student ? `${c.student.firstName} ${c.student.lastName}` : 'General',
      familyId: c.familyId || '',
      familyName: c.family?.name || 'Familia',
      chargeType: c.chargeType,
      description: c.description,
      dueDate: c.dueDate.toISOString().split('T')[0],
      originalAmount: Number(c.originalAmount),
      discountAmount: Number(c.discountAmount),
      amount: Number(c.totalAmount),
      paidAmount: Number(c.paidAmount),
      balance: Number(c.balance),
      status: c.status,
      createdAt: c.createdAt,
    }));
  }

  async createCharge(academyId: string, dto: CreateChargeDto) {
    let familyId = dto.familyId;
    if (dto.studentId && !familyId) {
      const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
      familyId = student?.familyId || undefined;
    }

    const original = new Prisma.Decimal(dto.amount);
    const discount = new Prisma.Decimal(dto.discountAmount || 0);
    const total = original.minus(discount);

    return await this.prisma.charge.create({
      data: {
        academyId,
        studentId: dto.studentId || null,
        familyId: familyId || null,
        chargeType: dto.chargeType as ChargeType,
        description: dto.description,
        dueDate: new Date(dto.dueDate),
        originalAmount: original,
        discountAmount: discount,
        totalAmount: total,
        paidAmount: new Prisma.Decimal(0),
        balance: total,
        status: 'PENDING',
      },
    });
  }

  // ==========================================
  // PAGOS (PAYMENTS)
  // ==========================================
  async getPayments(academyId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { academyId },
      include: {
        family: true,
        allocations: {
          include: {
            charge: {
              include: { student: true },
            },
          },
        },
        invoices: true,
        refunds: true,
      },
      orderBy: { paidAt: 'desc' },
      take: 100,
    });

    return payments.map((p) => {
      const firstAlloc = p.allocations[0];
      const student = firstAlloc?.charge?.student || null;

      return {
        id: p.id,
        academyId: p.academyId,
        studentId: student?.id || '',
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Familia',
        familyId: p.familyId || '',
        familyName: p.family?.name || 'Familia',
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber || '',
        paidAt: p.paidAt.toISOString(),
        receivedBy: p.receivedById || 'Cajero Central',
        notes: p.notes || '',
        allocations: p.allocations.map((a) => ({
          chargeId: a.chargeId,
          concept: a.charge?.description || 'Cargo',
          amount: Number(a.amount),
        })),
        invoiceNumber: p.invoices[0] ? `${p.invoices[0].series}-${p.invoices[0].correlative}` : undefined,
        invoiceType: p.invoices[0]?.invoiceType || undefined,
        refundedAmount: p.refunds.reduce((acc, r) => acc + Number(r.amount), 0),
        isRefunded: p.refunds.length > 0,
      };
    });
  }

  async createPayment(academyId: string, dto: CreatePaymentDto, cashierUserId?: string) {
    let familyId = dto.familyId;
    let studentId = dto.studentId;

    if (studentId && !familyId) {
      const student = await this.prisma.student.findUnique({ where: { id: studentId } });
      familyId = student?.familyId || undefined;
    }

    const paymentAmount = new Prisma.Decimal(dto.amount);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Crear el registro Payment
      const payment = await tx.payment.create({
        data: {
          academyId,
          familyId: familyId || null,
          amount: paymentAmount,
          paymentMethod: dto.paymentMethod as PaymentMethod,
          referenceNumber: dto.referenceNumber || null,
          receivedById: cashierUserId || 'usr-cashier',
          notes: dto.notes || null,
        },
      });

      let remainingToAllocate = paymentAmount;

      // 2. Si se especificaron asignaciones manuales
      if (dto.allocations && dto.allocations.length > 0) {
        for (const alloc of dto.allocations) {
          const allocAmount = new Prisma.Decimal(alloc.amount);
          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              chargeId: alloc.chargeId,
              amount: allocAmount,
            },
          });

          // Actualizar cargo
          const charge = await tx.charge.findUnique({ where: { id: alloc.chargeId } });
          if (charge) {
            const newPaid = charge.paidAmount.plus(allocAmount);
            const newBalance = charge.totalAmount.minus(newPaid);
            const newStatus: ChargeStatus = newBalance.lessThanOrEqualTo(0) ? 'PAID' : 'PARTIALLY_PAID';

            await tx.charge.update({
              where: { id: alloc.chargeId },
              data: {
                paidAmount: newPaid,
                balance: newBalance.lessThan(0) ? new Prisma.Decimal(0) : newBalance,
                status: newStatus,
              },
            });
          }

          remainingToAllocate = remainingToAllocate.minus(allocAmount);
        }
      } else {
        // Auto-asignación a los cargos más antiguos pendientes
        const pendingCharges = await tx.charge.findMany({
          where: {
            academyId,
            ...(studentId ? { studentId } : familyId ? { familyId } : {}),
            status: { in: ['PENDING', 'PARTIALLY_PAID'] },
          },
          orderBy: { dueDate: 'asc' },
        });

        for (const charge of pendingCharges) {
          if (remainingToAllocate.lessThanOrEqualTo(0)) break;

          const toPay = Prisma.Decimal.min(remainingToAllocate, charge.balance);
          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              chargeId: charge.id,
              amount: toPay,
            },
          });

          const newPaid = charge.paidAmount.plus(toPay);
          const newBalance = charge.totalAmount.minus(newPaid);
          const newStatus: ChargeStatus = newBalance.lessThanOrEqualTo(0) ? 'PAID' : 'PARTIALLY_PAID';

          await tx.charge.update({
            where: { id: charge.id },
            data: {
              paidAmount: newPaid,
              balance: newBalance.lessThan(0) ? new Prisma.Decimal(0) : newBalance,
              status: newStatus,
            },
          });

          remainingToAllocate = remainingToAllocate.minus(toPay);
        }
      }

      // 3. Si quedó saldo a favor (sobrepago), generar CustomerCredit
      if (remainingToAllocate.greaterThan(0) && familyId) {
        await tx.customerCredit.create({
          data: {
            academyId,
            familyId,
            amount: remainingToAllocate,
            remaining: remainingToAllocate,
            reason: 'Sobrepago en ventanilla / Saldo a favor',
          },
        });
      }

      // 4. Si solicitó Boleta o Factura, generar el comprobante
      if (dto.invoiceType && dto.invoiceType !== 'NONE' && dto.invoiceType !== 'RECIBO') {
        const series = dto.invoiceType === 'FACTURA' ? 'F001' : 'B001';
        const lastInv = await tx.invoice.findFirst({
          where: { academyId, series },
          orderBy: { correlative: 'desc' },
        });
        const correlative = (lastInv?.correlative || 0) + 1;

        const subtotal = paymentAmount.dividedBy(1.18);
        const igv = paymentAmount.minus(subtotal);

        await tx.invoice.create({
          data: {
            academyId,
            paymentId: payment.id,
            invoiceType: dto.invoiceType as any,
            series,
            correlative,
            clientDocType: dto.invoiceType === 'FACTURA' ? '6' : '1',
            clientDocNum: '72345678',
            clientName: 'Cliente Demo Central',
            subtotal,
            igv,
            total: paymentAmount,
            status: 'ACCEPTED',
            sunatMessage: 'Comprobante generado y aceptado en contingencia demo',
          },
        });
      }

      this.logger.log(` Pago registrado por S/ ${paymentAmount} en academia ${academyId}`);
      return payment;
    });
  }

  // ==========================================
  // CRÉDITOS A FAVOR (CUSTOMER CREDITS)
  // ==========================================
  async getCustomerCredits(academyId: string) {
    const credits = await this.prisma.customerCredit.findMany({
      where: { academyId },
      include: { family: true },
      orderBy: { createdAt: 'desc' },
    });

    return credits.map((c) => ({
      id: c.id,
      familyId: c.familyId,
      familyName: c.family?.name || 'Familia',
      amount: Number(c.amount),
      remaining: Number(c.remaining),
      reason: c.reason,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  // ==========================================
  // REEMBOLSOS (REFUNDS)
  // ==========================================
  async createRefund(academyId: string, dto: CreateRefundDto, cashierUserId?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: dto.paymentId, academyId },
    });

    if (!payment) {
      throw new NotFoundException(`Pago ${dto.paymentId} no encontrado`);
    }

    const refundAmount = new Prisma.Decimal(dto.amount);
    if (refundAmount.greaterThan(payment.amount)) {
      throw new BadRequestException('El monto de devolución no puede ser mayor al pago original');
    }

    return await this.prisma.refund.create({
      data: {
        paymentId: dto.paymentId,
        amount: refundAmount,
        reason: dto.reason,
        processedBy: cashierUserId || 'usr-cashier',
      },
    });
  }
}
