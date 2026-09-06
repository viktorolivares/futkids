import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import {
  CreateSportDto,
  CreateGroupDto,
  CreateSessionDto,
  SaveAttendanceDto,
} from './dto/academic.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant, TenantContext } from '../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Academic (Deportes, Grupos, Clases & Asistencias)')
@Controller('academic')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'x-academy-id',
  description: 'ID de la academia activa',
  required: true,
})
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // SPORTS
  @Get('sports')
  @ApiOperation({ summary: 'Listar disciplinas deportivas de la academia' })
  async getSports(@CurrentTenant() tenant: TenantContext) {
    return await this.academicService.getSports(tenant.academyId);
  }

  @Post('sports')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva disciplina deportiva' })
  async createSport(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateSportDto,
  ) {
    return await this.academicService.createSport(tenant.academyId, dto);
  }

  // GROUPS
  @Get('groups')
  @ApiOperation({ summary: 'Listar categorías/grupos con horarios' })
  async getGroups(@CurrentTenant() tenant: TenantContext) {
    return await this.academicService.getGroups(tenant.academyId);
  }

  @Post('groups')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo grupo con sus horarios' })
  async createGroup(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateGroupDto,
  ) {
    return await this.academicService.createGroup(tenant.academyId, dto);
  }

  // SESSIONS & ATTENDANCE
  @Get('sessions')
  @ApiOperation({ summary: 'Listar sesiones de clase con asistencias' })
  async getSessions(@CurrentTenant() tenant: TenantContext) {
    return await this.academicService.getSessions(tenant.academyId);
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Programar nueva sesión de clase' })
  async createSession(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateSessionDto,
  ) {
    return await this.academicService.createSession(tenant.academyId, dto);
  }

  @Put('sessions/:id/attendance')
  @ApiOperation({ summary: 'Guardar toma de asistencia de una sesión de clase' })
  @ApiResponse({ status: 200, description: 'Asistencia guardada en base de datos' })
  async saveAttendance(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') sessionId: string,
    @Body() dto: SaveAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.academicService.saveAttendance(tenant.academyId, sessionId, dto, user?.userId);
  }
}
