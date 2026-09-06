import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Token de acceso no proporcionado o inválido',
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'super-secret-jwt-key-change-in-prod';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      request.user = {
        ...payload,
        userId: payload.userId || payload.sub,
      };
      return true;
    } catch {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'TOKEN_EXPIRED_OR_INVALID',
        message: 'El token de sesión ha expirado o no es válido',
      });
    }
  }
}
