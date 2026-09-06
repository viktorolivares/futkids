import { describe, it, expect, vi } from 'vitest';
import { HealthService } from '../src/health/health.service';

describe('HealthService', () => {
  it('should return health status ok when database and redis respond successfully', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    };
    const mockRedis = {
      ping: vi.fn().mockResolvedValue('PONG'),
    };
    const mockQueues = {
      billing: { getWaitingCount: vi.fn().mockResolvedValue(0), getActiveCount: vi.fn().mockResolvedValue(0) },
      whatsapp: { getWaitingCount: vi.fn().mockResolvedValue(0), getActiveCount: vi.fn().mockResolvedValue(0) },
      email: { getWaitingCount: vi.fn().mockResolvedValue(0), getActiveCount: vi.fn().mockResolvedValue(0) },
      documents: { getWaitingCount: vi.fn().mockResolvedValue(0), getActiveCount: vi.fn().mockResolvedValue(0) },
      reports: { getWaitingCount: vi.fn().mockResolvedValue(0), getActiveCount: vi.fn().mockResolvedValue(0) },
      reminders: { getWaitingCount: vi.fn().mockResolvedValue(0), getActiveCount: vi.fn().mockResolvedValue(0) },
    };

    const healthService = new HealthService(mockPrisma as any, mockRedis as any, mockQueues as any);
    const result = await healthService.check();

    expect(result.status).toBe('ok');
    expect(result.services.database.status).toBe('connected');
    expect(result.services.redis.status).toBe('connected');
    expect(result.services.bullmq.status).toBe('active');
  });

  it('should return status degraded when database fails', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('DB Connection Refused')),
    };
    const mockRedis = {
      ping: vi.fn().mockResolvedValue('PONG'),
    };
    const mockQueues = {};

    const healthService = new HealthService(mockPrisma as any, mockRedis as any, mockQueues as any);
    const result = await healthService.check();

    expect(result.status).toBe('degraded');
    expect(result.services.database.status).toBe('disconnected');
    expect(result.services.redis.status).toBe('connected');
  });
});
