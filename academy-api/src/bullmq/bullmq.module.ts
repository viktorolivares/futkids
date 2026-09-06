import { Global, Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export const QUEUE_NAMES = {
  BILLING: 'billing',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  DOCUMENTS: 'documents',
  REPORTS: 'reports',
  REMINDERS: 'reminders',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

@Global()
@Module({
  providers: [
    {
      provide: 'BULLMQ_QUEUES',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const password = configService.get<string>('REDIS_PASSWORD');

        const connection = {
          host,
          port,
          password: password || undefined,
        };

        const queues: Record<string, Queue> = {};
        for (const queueName of Object.values(QUEUE_NAMES)) {
          queues[queueName] = new Queue(queueName, {
            connection,
            defaultJobOptions: {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 5000,
              },
              removeOnComplete: 100,
              removeOnFail: 500,
            },
          });
        }
        return queues;
      },
    },
  ],
  exports: ['BULLMQ_QUEUES'],
})
export class BullQueueModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BullQueueModule.name);

  onModuleInit() {
    this.logger.log(` BullMQ Queues initialized: [${Object.values(QUEUE_NAMES).join(', ')}]`);
  }

  async onModuleDestroy() {
    this.logger.log('Closing BullMQ Queues...');
  }
}
