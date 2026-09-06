import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantContext {
  academyId: string;
  role: string;
}

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);
