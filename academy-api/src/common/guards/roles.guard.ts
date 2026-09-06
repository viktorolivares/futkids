import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(Role | string)[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    if (!tenant || !tenant.role) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'TENANT_ROLE_MISSING',
        message: 'No se encontró rol asignado en el contexto del tenant activo',
      });
    }

    const hasRole = requiredRoles.some((role) => role === tenant.role);
    if (!hasRole) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Acción denegada: Se requiere uno de los roles [${requiredRoles.join(', ')}]. Tu rol actual es [${tenant.role}]`,
      });
    }

    return true;
  }
}
