import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import {
  CreateChargeDto,
  CreatePaymentDto,
  CreateRefundDto,
} from './dto/finance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant, TenantContext } from '../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Finance & Cashier (Caja, Cargos, Pagos & Créditos)')
@Controller('finance')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'x-academy-id',
  description: 'ID de la academia activa',
  required: true,
})
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // CHARGES
  @Get('charges')
  @ApiOperation({ summary: 'Listar todos los cargos/cuotas de la academia' })
  async getCharges(@CurrentTenant() tenant: TenantContext) {
    return await this.financeService.getCharges(tenant.academyId);
  }

  @Post('charges')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir un nuevo cargo o cuota' })
  async createCharge(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateChargeDto,
  ) {
    return await this.financeService.createCharge(tenant.academyId, dto);
  }

  // PAYMENTS
  @Get('payments')
  @ApiOperation({ summary: 'Listar historial de pagos y cobros' })
  async getPayments(@CurrentTenant() tenant: TenantContext) {
    return await this.financeService.getPayments(tenant.academyId);
  }

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo pago en ventanilla' })
  async createPayment(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.financeService.createPayment(tenant.academyId, dto, user?.userId);
  }

  // CUSTOMER CREDITS
  @Get('customer-credits')
  @ApiOperation({ summary: 'Listar saldos a favor de clientes/familias' })
  async getCustomerCredits(@CurrentTenant() tenant: TenantContext) {
    return await this.financeService.getCustomerCredits(tenant.academyId);
  }

  // REFUNDS
  @Post('refunds')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar devolución o reembolso de pago' })
  async createRefund(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateRefundDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.financeService.createRefund(tenant.academyId, dto, user?.userId);
  }
}
