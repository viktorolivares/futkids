import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant, TenantContext } from '../common/decorators/current-tenant.decorator';

@ApiTags('Academy Policies (Políticas de Operación & Cobranza)')
@Controller('policies')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'x-academy-id',
  description: 'ID de la academia activa',
  required: true,
})
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener políticas operativas de la academia' })
  async getPolicy(@CurrentTenant() tenant: TenantContext) {
    return await this.policiesService.getPolicy(tenant.academyId);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualizar políticas operativas' })
  async updatePolicy(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: any,
  ) {
    return await this.policiesService.updatePolicy(tenant.academyId, data);
  }
}
