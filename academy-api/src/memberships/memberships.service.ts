import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';

@Injectable()
export class MembershipsService {
  private readonly logger = new Logger(MembershipsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(academyId: string, dto: CreateMembershipDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'El usuario especificado no existe',
      });
    }

    // Check if membership already exists
    const existing = await this.prisma.membership.findUnique({
      where: {
        academyId_userId_role: {
          academyId,
          userId: dto.userId,
          role: dto.role,
        },
      },
    });

    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        code: 'MEMBERSHIP_ALREADY_EXISTS',
        message: 'El usuario ya cuenta con ese rol asignado en esta academia',
      });
    }

    const membership = await this.prisma.membership.create({
      data: {
        academyId,
        userId: dto.userId,
        role: dto.role,
        isDefault: dto.isDefault || false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Membership created: User ${dto.userId} as ${dto.role} in Academy ${academyId}`);
    return membership;
  }

  async findByAcademy(academyId: string) {
    return await this.prisma.membership.findMany({
      where: {
        academyId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            documentNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(academyId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, academyId },
    });

    if (!membership) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'MEMBERSHIP_NOT_FOUND',
        message: 'Membresía no encontrada',
      });
    }

    await this.prisma.membership.update({
      where: { id: membershipId },
      data: { isActive: false },
    });

    return { success: true, message: 'Membresía revocada exitosamente' };
  }
}
