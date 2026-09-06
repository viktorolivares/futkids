import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../bullmq/bullmq.module';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latencyMs?: number;
      type: 'PostgreSQL (Prisma)';
    };
    redis: {
      status: 'connected' | 'disconnected';
      response?: string;
    };
    bullmq: {
      status: 'active' | 'degraded';
      queues: Record<string, { waiting: number; active: number }>;
    };
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject('BULLMQ_QUEUES') private readonly queues: Record<string, Queue>,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const start = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbLatency = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = 'disconnected';
    }

    let redisStatus: 'connected' | 'disconnected' = 'disconnected';
    let redisResponse = 'NONE';
    try {
      redisResponse = await this.redis.ping();
      redisStatus = redisResponse === 'PONG' ? 'connected' : 'disconnected';
    } catch {
      redisStatus = 'disconnected';
    }

    const queueCounts: Record<string, { waiting: number; active: number }> = {};
    for (const name of Object.values(QUEUE_NAMES)) {
      try {
        const queue = this.queues[name];
        if (queue) {
          queueCounts[name] = {
            waiting: await queue.getWaitingCount().catch(() => 0),
            active: await queue.getActiveCount().catch(() => 0),
          };
        }
      } catch {
        queueCounts[name] = { waiting: 0, active: 0 };
      }
    }

    const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          type: 'PostgreSQL (Prisma)',
        },
        redis: {
          status: redisStatus,
          response: redisResponse,
        },
        bullmq: {
          status: redisStatus === 'connected' ? 'active' : 'degraded',
          queues: queueCounts,
        },
      },
    };
  }
}
