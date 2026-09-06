import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CommercialService } from './commercial.service';
import { CreatePackageDto, CreatePromotionDto } from './dto/commercial.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant, TenantContext } from '../common/decorators/current-tenant.decorator';

@ApiTags('Commercial (Paquetes, Promociones & Clases de Prueba)')
@Controller('commercial')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'x-academy-id',
  description: 'ID de la academia activa',
  required: true,
})
export class CommercialController {
  constructor(private readonly commercialService: CommercialService) {}

  // PACKAGES
  @Get('packages')
  @ApiOperation({ summary: 'Listar paquetes de clases de la academia' })
  async getPackages(@CurrentTenant() tenant: TenantContext) {
    return await this.commercialService.getPackages(tenant.academyId);
  }

  @Post('packages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo paquete de clases' })
  async createPackage(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreatePackageDto,
  ) {
    return await this.commercialService.createPackage(tenant.academyId, dto);
  }

  // PROMOTIONS
  @Get('promotions')
  @ApiOperation({ summary: 'Listar promociones y cupones de descuento' })
  async getPromotions(@CurrentTenant() tenant: TenantContext) {
    return await this.commercialService.getPromotions(tenant.academyId);
  }

  @Post('promotions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva promoción o cupón de descuento' })
  async createPromotion(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreatePromotionDto,
  ) {
    return await this.commercialService.createPromotion(tenant.academyId, dto);
  }

  // TRIALS
  @Get('trials')
  @ApiOperation({ summary: 'Listar alumnos en clase de prueba' })
  async getTrials(@CurrentTenant() tenant: TenantContext) {
    return await this.commercialService.getTrials(tenant.academyId);
  }

  @Patch('trials/:id/convert')
  @ApiOperation({ summary: 'Convertir alumno de prueba a matriculado' })
  async convertTrial(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') trialId: string,
  ) {
    return await this.commercialService.convertTrial(tenant.academyId, trialId);
  }
}
