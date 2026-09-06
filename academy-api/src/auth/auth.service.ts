import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            academy: {
              select: { id: true, name: true, isActive: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Correo electrónico o contraseña incorrectos',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Correo electrónico o contraseña incorrectos',
      });
    }

    // Filter memberships only to active academies
    const activeMemberships = user.memberships
      .filter((m) => m.academy.isActive)
      .map((m) => ({
        academyId: m.academyId,
        academyName: m.academy.name,
        role: m.role,
        isDefault: m.isDefault,
      }));

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, activeMemberships, user.isSuperAdmin);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 86400, // 24 hours
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
        memberships: activeMemberships,
      },
    };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'super-secret-refresh-key-change-in-prod';

    try {
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: refreshSecret,
      });

      // Check if refresh token was revoked in Redis
      const isRevoked = await this.redis.get(`revoked_token:${dto.refreshToken}`);
      if (isRevoked) {
        throw new UnauthorizedException({
          statusCode: 401,
          code: 'TOKEN_REVOKED',
          message: 'El refresh token ha sido revocado',
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          memberships: {
            where: { isActive: true },
            include: {
              academy: { select: { id: true, name: true, isActive: true } },
            },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException({
          statusCode: 401,
          code: 'USER_INACTIVE',
          message: 'Usuario no encontrado o inactivo',
        });
      }

      const activeMemberships = user.memberships
        .filter((m) => m.academy.isActive)
        .map((m) => ({
          academyId: m.academyId,
          academyName: m.academy.name,
          role: m.role,
          isDefault: m.isDefault,
        }));

      return await this.generateTokens(user.id, user.email, activeMemberships);
    } catch {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'El refresh token es inválido o ha expirado',
      });
    }
  }

  async logout(refreshToken?: string): Promise<{ success: boolean; message: string }> {
    if (refreshToken) {
      // Store in Redis blacklist for 7 days
      await this.redis.set(`revoked_token:${refreshToken}`, 'true', 7 * 24 * 3600);
    }
    return {
      success: true,
      message: 'Sesión cerrada exitosamente',
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuperAdmin: true,
        documentType: true,
        documentNumber: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        memberships: {
          where: { isActive: true },
          include: {
            academy: {
              select: {
                id: true,
                name: true,
                slug: true,
                ruc: true,
                city: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'Usuario no encontrado',
      });
    }

    return user;
  }

  private async generateTokens(
    userId: string,
    email: string,
    memberships: Array<{ academyId: string; academyName: string; role: string }>,
    isSuperAdmin = false,
  ) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'super-secret-jwt-key-change-in-prod';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'super-secret-refresh-key-change-in-prod';

    const tokenPayload = {
      sub: userId,
      userId,
      email,
      isSuperAdmin,
      memberships,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, {
        secret: jwtSecret,
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: refreshSecret,
          expiresIn: '7d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
