import { Module, Global } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PlanLimitService } from './plan-limit.service';
import { PlansService } from './plans.service';
import { FeatureGuard } from './guards/feature.guard';
import { SubscriptionsController } from './subscriptions.controller';
import { PlansController } from './plans.controller';

@Global()
@Module({
  controllers: [SubscriptionsController, PlansController],
  providers: [
    SubscriptionsService,
    PlanLimitService,
    PlansService,
    FeatureGuard,
  ],
  exports: [
    SubscriptionsService,
    PlanLimitService,
    PlansService,
    FeatureGuard,
  ],
})
export class SubscriptionsModule {}
