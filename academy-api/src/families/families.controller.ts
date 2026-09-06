import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant, TenantContext } from '../common/decorators/current-tenant.decorator';

@ApiTags('Families (Familias & Apoderados)')
@Controller('families')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'x-academy-id',
  description: 'ID de la academia activa',
  required: true,
})
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las familias de la academia' })
  @ApiResponse({ status: 200, description: 'Listado de familias con contactos y alumnos' })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query('search') search?: string,
  ) {
    return await this.familiesService.findAll(tenant.academyId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una familia' })
  @ApiResponse({ status: 200, description: 'Detalle de la familia con estado de cuenta' })
  @ApiResponse({ status: 404, description: 'Familia no encontrada' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return await this.familiesService.findOne(tenant.academyId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nueva familia con contactos' })
  @ApiResponse({ status: 201, description: 'Familia creada exitosamente' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateFamilyDto,
  ) {
    return await this.familiesService.create(tenant.academyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar información de una familia' })
  @ApiResponse({ status: 200, description: 'Familia actualizada' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyDto,
  ) {
    return await this.familiesService.update(tenant.academyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una familia' })
  @ApiResponse({ status: 200, description: 'Familia eliminada' })
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return await this.familiesService.remove(tenant.academyId, id);
  }
}
