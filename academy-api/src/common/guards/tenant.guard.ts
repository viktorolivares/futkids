import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'USER_CONTEXT_MISSING',
        message: 'No se encontró contexto de usuario autenticado para validar el tenant',
      });
    }

    // Attempt to extract academyId from x-academy-id header, query, or body
    const headerAcademyId = request.headers['x-academy-id'] as string;
    const paramAcademyId = request.params?.academyId as string;
    const requestedAcademyId = headerAcademyId || paramAcademyId;

    const memberships = user.memberships || [];

    if (!memberships.length) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'NO_ACTIVE_MEMBERSHIPS',
        message: 'El usuario no pertenece a ninguna academia activa',
      });
    }

    let targetAcademyId = requestedAcademyId;

    // If no specific academyId is requested and user has a single membership, default to it
    if (!targetAcademyId) {
      if (memberships.length === 1) {
        targetAcademyId = memberships[0].academyId;
      } else {
        throw new BadRequestException({
          statusCode: 400,
          code: 'ACADEMY_CONTEXT_REQUIRED',
          message: 'Debes especificar la academia activa mediante la cabecera x-academy-id',
        });
      }
    }

    // STRICT MULTI-TENANCY VALIDATION:
    // Verify that the authenticated user actually has an active membership in the target academy.
    // Never trust an academyId sent directly by the client!
    const matchingMembership = memberships.find(
      (m: { academyId: string; role: string }) => m.academyId === targetAcademyId,
    );

    if (!matchingMembership) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'FORBIDDEN_TENANT_ACCESS',
        message: 'No tienes permisos ni membresía activa en la academia solicitada',
      });
    }

    // Set secure tenant context in the request
    request.tenant = {
      academyId: matchingMembership.academyId,
      role: matchingMembership.role,
    };

    return true;
  }
}
