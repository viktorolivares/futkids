import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant, TenantContext } from '../common/decorators/current-tenant.decorator';
import {
  SubscriptionStatusResponseDto,
  UpgradeSubscriptionDto,
  DowngradeSubscriptionDto,
} from './dto/subscription.dto';

@ApiTags('Subscriptions & SaaS')
@Controller('subscription')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'x-academy-id',
  description: 'ID de la academia activa',
  required: true,
})
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener Estado de Suscripción de la Academia',
    description:
      'Retorna el plan activo, estado del periodo de prueba (días restantes), límites operativos, métricas de uso reales y mapa de funcionalidades habilitadas.',
  })
  @ApiResponse({
    status: 200,
    type: SubscriptionStatusResponseDto,
    description: 'Estado de la suscripción',
  })
  @ApiResponse({ status: 403, description: 'Acceso denegado a este tenant' })
  async getSubscription(@CurrentTenant() tenant: TenantContext): Promise<SubscriptionStatusResponseDto> {
    return await this.subscriptionsService.getSubscriptionStatusWithUsage(tenant.academyId);
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar Suscripción a Plan PRO',
    description:
      'Activa el Plan PRO para la academia, desbloqueando alumnos ilimitados, grupos ilimitados, facturación electrónica SUNAT y automatización.',
  })
  @ApiResponse({
    status: 200,
    type: SubscriptionStatusResponseDto,
    description: 'Plan Pro activado exitosamente',
  })
  async upgradePlan(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpgradeSubscriptionDto,
  ) {
    return await this.subscriptionsService.upgradeToPlan(tenant.academyId, dto.planCode || 'PRO');
  }

  @Post('downgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Degradar Suscripción a Plan FREE',
    description:
      'Cambia la suscripción al Plan FREE. No borra ningún alumno ni dato histórico existente, pero aplicará los límites de 30 alumnos para nuevas altas.',
  })
  @ApiResponse({
    status: 200,
    type: SubscriptionStatusResponseDto,
    description: 'Degradado a Plan Free manteniendo todos los datos históricos intactos',
  })
  async downgradePlan(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: DowngradeSubscriptionDto,
  ) {
    return await this.subscriptionsService.downgradeToFree(tenant.academyId);
  }
}
