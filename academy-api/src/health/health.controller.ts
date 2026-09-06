import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from './health.service';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health Check & Service Status',
    description: 'Verifica la conectividad y latencia con PostgreSQL (Prisma), Redis y estado de colas BullMQ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de salud del sistema retornado con éxito',
  })
  async getHealth(): Promise<HealthCheckResult> {
    return await this.healthService.check();
  }
}
