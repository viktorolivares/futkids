import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  sub?: string;
  email: string;
  isSuperAdmin?: boolean;
  firstName?: string;
  lastName?: string;
  memberships: Array<{
    academyId: string;
    academyName?: string;
    role: string;
  }>;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return data && user ? user[data] : user;
  },
);
