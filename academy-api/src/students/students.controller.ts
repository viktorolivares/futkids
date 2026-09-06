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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant, TenantContext } from '../common/decorators/current-tenant.decorator';

@ApiTags('Students (Alumnos)')
@Controller('students')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'x-academy-id',
  description: 'ID de la academia activa',
  required: true,
})
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los alumnos de la academia activa' })
  @ApiResponse({ status: 200, description: 'Listado de alumnos con grupos, familia y saldo' })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query('search') search?: string,
  ) {
    return await this.studentsService.findAll(tenant.academyId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de un alumno' })
  @ApiResponse({ status: 200, description: 'Detalle del alumno con asistencias y cargos' })
  @ApiResponse({ status: 404, description: 'Alumno no encontrado' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return await this.studentsService.findOne(tenant.academyId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo alumno en la academia' })
  @ApiResponse({ status: 201, description: 'Alumno creado exitosamente' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateStudentDto,
  ) {
    return await this.studentsService.create(tenant.academyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un alumno' })
  @ApiResponse({ status: 200, description: 'Alumno actualizado exitosamente' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return await this.studentsService.update(tenant.academyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar o eliminar alumno' })
  @ApiResponse({ status: 200, description: 'Alumno desactivado' })
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return await this.studentsService.remove(tenant.academyId, id);
  }
}
