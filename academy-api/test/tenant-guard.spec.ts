import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { TenantGuard } from '../src/common/guards/tenant.guard';

describe('TenantGuard (Multi-Tenancy Security)', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  function createMockExecutionContext(user: any, headers: Record<string, string> = {}, params: Record<string, string> = {}): ExecutionContext {
    const request = {
      user,
      headers,
      params,
      tenant: null,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('should throw ForbiddenException if request has no user context', () => {
    const context = createMockExecutionContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user has no memberships', () => {
    const context = createMockExecutionContext({
      userId: 'usr-1',
      memberships: [],
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should auto-select tenant if user has exactly one membership and no header provided', () => {
    const context = createMockExecutionContext({
      userId: 'usr-1',
      memberships: [{ academyId: 'acad-alianza', role: 'OWNER' }],
    });

    const canActivate = guard.canActivate(context);
    expect(canActivate).toBe(true);
    const req = context.switchToHttp().getRequest() as any;
    expect(req.tenant).toEqual({
      academyId: 'acad-alianza',
      role: 'OWNER',
    });
  });

  it('should throw BadRequestException if user has multiple memberships and no header is provided', () => {
    const context = createMockExecutionContext({
      userId: 'usr-1',
      memberships: [
        { academyId: 'acad-alianza', role: 'OWNER' },
        { academyId: 'acad-cristal', role: 'COACH' },
      ],
    });
    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });

  it('should allow access when requested academyId matches an active membership', () => {
    const context = createMockExecutionContext(
      {
        userId: 'usr-1',
        memberships: [
          { academyId: 'acad-alianza', role: 'OWNER' },
          { academyId: 'acad-cristal', role: 'COACH' },
        ],
      },
      { 'x-academy-id': 'acad-cristal' },
    );

    const canActivate = guard.canActivate(context);
    expect(canActivate).toBe(true);
    const req = context.switchToHttp().getRequest() as any;
    expect(req.tenant).toEqual({
      academyId: 'acad-cristal',
      role: 'COACH',
    });
  });

  it('STRICT SECURITY RULE: should reject unauthorized tenant access if user does NOT belong to requested academy', () => {
    const context = createMockExecutionContext(
      {
        userId: 'usr-attacker',
        memberships: [{ academyId: 'acad-alianza', role: 'STAFF' }],
      },
      { 'x-academy-id': 'acad-universitario-secret' }, // Target tenant they do not belong to
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
