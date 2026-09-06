import {
  Controller,
  Get,
  Post,
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
}
