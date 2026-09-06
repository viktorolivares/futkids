import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AcademiesService } from './academies.service';
import { CreateAcademyDto } from './dto/create-academy.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Academies (Tenants)')
@Controller('academies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AcademiesController {
  constructor(private readonly academiesService: AcademiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar Nueva Academia Deportiva (Tenant)',
    description: 'Crea una nueva academia y asigna al usuario autenticado el rol de OWNER de forma inmediata.',
  })
  @ApiResponse({ status: 201, description: 'Academia creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Slug o RUC ya existente' })
  async create(
    @Body() createDto: CreateAcademyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.academiesService.create(createDto, user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar Todas las Academias (SuperAdmin / Directorio SaaS)',
    description: 'Retorna la lista de todas las academias registradas en PostgreSQL con sus métricas para el SuperAdmin.',
  })
  @ApiResponse({ status: 200, description: 'Listado completo de academias' })
  async findAll() {
    return await this.academiesService.findAll();
  }

  @Get('my')
  @ApiOperation({
    summary: 'Listar mis Academias',
    description: 'Retorna la lista de academias donde el usuario autenticado tiene membresía activa.',
  })
  @ApiResponse({ status: 200, description: 'Listado de academias del usuario' })
  async findMy(@CurrentUser() user: AuthenticatedUser) {
    return await this.academiesService.findMyAcademies(user.userId);
  }

  @Get(':id')
  @UseGuards(TenantGuard)
  @ApiHeader({
    name: 'x-academy-id',
    description: 'ID de la academia (debe coincidir con la membresía del usuario)',
    required: true,
  })
  @ApiOperation({
    summary: 'Obtener Detalles de una Academia',
    description: 'Retorna la información completa de la academia protegida por TenantGuard (valida membresía).',
  })
  @ApiResponse({ status: 200, description: 'Detalle de la academia' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a este tenant' })
  async findById(@Param('id') id: string) {
    return await this.academiesService.findById(id);
  }

  @Get(':id/staff')
  @UseGuards(TenantGuard)
  @ApiHeader({ name: 'x-academy-id', required: true })
  @ApiOperation({ summary: 'Listar Personal de la Sede' })
  async getStaff(@Param('id') id: string) {
    return await this.academiesService.getStaff(id);
  }

  @Post(':id/staff')
  @UseGuards(TenantGuard)
  @ApiHeader({ name: 'x-academy-id', required: true })
  @ApiOperation({ summary: 'Asignar o Invitar Colaborador a la Sede' })
  async addStaff(@Param('id') id: string, @Body() body: any) {
    return await this.academiesService.addStaff(id, body);
  }

  @Delete(':id/staff/:membershipId')
  @UseGuards(TenantGuard)
  @ApiHeader({ name: 'x-academy-id', required: true })
  @ApiOperation({ summary: 'Revocar Acceso de Personal a la Sede' })
  async removeStaff(@Param('id') id: string, @Param('membershipId') membershipId: string) {
    return await this.academiesService.removeStaff(id, membershipId);
  }

  @Get(':id/billing-config')
  @UseGuards(TenantGuard)
  @ApiHeader({ name: 'x-academy-id', required: true })
  @ApiOperation({ summary: 'Consultar Configuración Fiscal y SUNAT de la Sede' })
  async getBillingConfig(@Param('id') id: string) {
    return await this.academiesService.getBillingConfig(id);
  }

  @Patch(':id/billing-config')
  @UseGuards(TenantGuard)
  @ApiHeader({ name: 'x-academy-id', required: true })
  @ApiOperation({ summary: 'Actualizar Configuración Fiscal y SUNAT de la Sede' })
  async updateBillingConfig(@Param('id') id: string, @Body() body: any) {
    return await this.academiesService.updateBillingConfig(id, body);
  }
}
