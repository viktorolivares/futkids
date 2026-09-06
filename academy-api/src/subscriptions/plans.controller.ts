import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { PlanDto } from './dto/plan.dto';

@ApiTags('Subscriptions & SaaS')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar Planes Disponibles (Free y Pro)',
    description:
      'Retorna el catálogo público de planes SaaS con sus precios, límites y funcionalidades detalladas.',
  })
  @ApiResponse({
    status: 200,
    type: [PlanDto],
    description: 'Catálogo de planes',
  })
  async getPlans() {
    return await this.plansService.findAll();
  }

  @Get(':code')
  @ApiOperation({
    summary: 'Obtener Detalle de un Plan por Código (FREE / PRO)',
    description: 'Retorna las características y límites específicos del plan solicitado.',
  })
  @ApiResponse({
    status: 200,
    type: PlanDto,
    description: 'Detalle del plan',
  })
  async getPlanByCode(@Param('code') code: string) {
    return await this.plansService.findByCode(code);
  }
}
