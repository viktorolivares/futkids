import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { FeatureGuard } from '../subscriptions/guards/feature.guard';
import { RequireFeature } from '../subscriptions/decorators/require-feature.decorator';
import { PlanFeatureKey } from '../subscriptions/constants/plan-features.constant';

@ApiTags('Invoices & SUNAT (Facturación Electrónica)')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('test-sunat-beta')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Probar integración directa con SUNAT Beta',
    description:
      'Genera, firma, empaqueta y envía un comprobante de prueba (Factura, Boleta, NC, ND) al WebService Beta de SUNAT y devuelve la traza completa y el CDR.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ejecución exitosa del ciclo contra SUNAT Beta',
  })
  async testSunatBeta(@Body() payload: any) {
    return await this.invoicesService.testSunatBeta(payload);
  }

  @Post()
  @UseGuards(JwtAuthGuard, TenantGuard, FeatureGuard)
  @RequireFeature(PlanFeatureKey.SUNAT_BILLING)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-academy-id',
    description: 'ID de la academia (Tenant)',
    required: true,
  })
  @ApiOperation({
    summary: 'Emitir Comprobante Electrónico (Factura, Boleta, NC, ND) [Plan PRO]',
    description:
      'Crea el comprobante, genera el XML UBL 2.1, lo firma con certificado digital y lo envía al servicio de SUNAT Beta o lo encola en BullMQ. Requiere Plan Pro.',
  })
  @ApiResponse({ status: 201, description: 'Comprobante creado y procesado' })
  @ApiResponse({ status: 403, description: 'Funcionalidad SUNAT_BILLING no disponible en plan FREE' })
  async create(
    @Body() createDto: CreateInvoiceDto,
    @Headers('x-academy-id') academyId: string,
  ) {
    return await this.invoicesService.create(createDto, academyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-academy-id',
    description: 'ID de la academia (Tenant)',
    required: true,
  })
  @ApiOperation({
    summary: 'Listar comprobantes electrónicos del tenant',
    description: 'Lista comprobantes con soporte de paginación y filtros por tipo y estado.',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de comprobantes' })
  async findAll(
    @Headers('x-academy-id') academyId: string,
    @Query() query: QueryInvoiceDto,
  ) {
    return await this.invoicesService.findAll(academyId, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-academy-id',
    description: 'ID de la academia (Tenant)',
    required: true,
  })
  @ApiOperation({
    summary: 'Obtener detalle de un comprobante',
    description: 'Retorna los datos completos del comprobante incluyendo XMLs y CDR.',
  })
  @ApiResponse({ status: 200, description: 'Detalle del comprobante' })
  @ApiResponse({ status: 404, description: 'Comprobante no encontrado' })
  async findById(
    @Param('id') id: string,
    @Headers('x-academy-id') academyId: string,
  ) {
    return await this.invoicesService.findById(id, academyId);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-academy-id',
    description: 'ID de la academia (Tenant)',
    required: true,
  })
  @ApiOperation({
    summary: 'Consultar estado SUNAT de un comprobante',
    description: 'Retorna el estado de aceptación o rechazo y códigos de respuesta de SUNAT.',
  })
  @ApiResponse({ status: 200, description: 'Estado del comprobante' })
  async getStatus(
    @Param('id') id: string,
    @Headers('x-academy-id') academyId: string,
  ) {
    return await this.invoicesService.getInvoiceStatus(id, academyId);
  }

  @Post(':id/send-sunat')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'x-academy-id',
    description: 'ID de la academia (Tenant)',
    required: true,
  })
  @ApiOperation({
    summary: 'Reenviar comprobante a SUNAT',
    description: 'Fuerza el reintento de envío de un comprobante pendiente o con error a SUNAT.',
  })
  @ApiResponse({ status: 200, description: 'Comprobante reenviado a SUNAT' })
  async sendToSunat(
    @Param('id') id: string,
    @Headers('x-academy-id') _academyId: string,
  ) {
    return await this.invoicesService.dispatchInvoiceToSunat(id);
  }
}
