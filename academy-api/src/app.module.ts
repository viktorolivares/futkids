import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { BullQueueModule } from './bullmq/bullmq.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AcademiesModule } from './academies/academies.module';
import { MembershipsModule } from './memberships/memberships.module';
import { SunatModule } from './sunat/sunat.module';
import { InvoicesModule } from './invoices/invoices.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    RedisModule,
    BullQueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AcademiesModule,
    MembershipsModule,
    SunatModule,
    InvoicesModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}
