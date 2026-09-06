import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { PlanLimitService } from '../plan-limit.service';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly planLimitService: PlanLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no feature is required on this route or controller, allow access
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;
    const academyId = tenant?.academyId || (request.headers['x-academy-id'] as string);

    if (!academyId) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'TENANT_CONTEXT_REQUIRED',
        message: 'No se puede verificar la funcionalidad del plan sin contexto de academia',
      });
    }

    // This will throw FeatureNotAvailableException if not enabled
    await this.planLimitService.assertHasFeature(academyId, requiredFeature);

    return true;
  }
}
