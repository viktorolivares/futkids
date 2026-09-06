import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        code: 'USER_ALREADY_EXISTS',
        message: 'El correo electrónico ya se encuentra registrado',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        documentType: dto.documentType || 'DNI',
        documentNumber: dto.documentNumber,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        documentType: true,
        documentNumber: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    this.logger.log(`User created: ${user.email} (${user.id})`);
    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        documentType: true,
        documentNumber: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
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
}
