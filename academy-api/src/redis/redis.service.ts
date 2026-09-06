import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.client.on('connect', () => {
      this.logger.log(` Connected to Redis at ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis connection warning: ${err.message}`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    try {
      if (!this.client || this.client.status !== 'ready') {
        await this.client?.connect().catch(() => {});
      }
      return await this.client.ping();
    } catch {
      return 'DISCONNECTED';
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Disconnected from Redis');
    }
  }
}
