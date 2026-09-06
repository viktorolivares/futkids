import { SetMetadata } from '@nestjs/common';
import { PlanFeatureKey } from '../constants/plan-features.constant';

export const REQUIRE_FEATURE_KEY = 'require_feature';

export const RequireFeature = (feature: PlanFeatureKey | string) =>
  SetMetadata(REQUIRE_FEATURE_KEY, feature);
