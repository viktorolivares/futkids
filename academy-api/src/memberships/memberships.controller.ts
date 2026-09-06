import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant, TenantContext } from '../common/decorators/current-tenant.decorator';
import { Role } from '@prisma/client';

@ApiTags('Memberships & Roles')
@Controller('memberships')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'x-academy-id',
  description: 'ID de la academia activa',
  required: true,
})
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Asignar Rol/Membresía a un Usuario',
    description: 'Permite a un OWNER o ADMIN asignar un nuevo rol (COACH, CASHIER, STAFF, PARENT) a un usuario dentro de la academia activa.',
  })
  @ApiResponse({ status: 201, description: 'Membresía creada con éxito' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() createDto: CreateMembershipDto,
  ) {
    return await this.membershipsService.create(tenant.academyId, createDto);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({
    summary: 'Listar Colaboradores y Membresías de la Academia',
    description: 'Retorna todos los usuarios y sus roles asociados a la academia del tenant activo.',
  })
  @ApiResponse({ status: 200, description: 'Lista de membresías de la academia' })
  async findByAcademy(@CurrentTenant() tenant: TenantContext) {
    return await this.membershipsService.findByAcademy(tenant.academyId);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @ApiOperation({
    summary: 'Revocar Membresía',
    description: 'Permite al OWNER revocar el acceso y rol de un miembro en la academia.',
  })
  @ApiResponse({ status: 200, description: 'Membresía revocada' })
  async revoke(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') membershipId: string,
  ) {
    return await this.membershipsService.revoke(tenant.academyId, membershipId);
  }
}
