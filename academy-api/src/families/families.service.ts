import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FamiliesService {
  private readonly logger = new Logger(FamiliesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(academyId: string, search?: string) {
    const where: Prisma.FamilyWhereInput = {
      academyId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { contacts: { some: { fullName: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const families = await this.prisma.family.findMany({
      where,
      include: {
        contacts: true,
        students: {
          include: {
            enrollments: {
              where: { isActive: true },
              include: { group: true },
            },
            charges: {
              where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
            },
          },
        },
        charges: {
          where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
        },
        credits: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return families.map((f) => {
      const primaryContact = f.contacts.find((c) => c.isPrimary) || f.contacts[0] || null;
      const totalBalance = f.charges.reduce((acc, c) => acc + Number(c.balance), 0);
      const totalCredits = f.credits.reduce((acc, c) => acc + Number(c.remaining), 0);

      return {
        id: f.id,
        academyId: f.academyId,
        name: f.name,
        code: f.code || '',
        notes: f.notes || '',
        primaryContactName: primaryContact?.fullName || 'Sin contacto',
        phone: primaryContact?.phone || '',
        email: primaryContact?.email || '',
        relationship: primaryContact?.relationship || 'APODERADO',
        studentsCount: f.students.length,
        students: f.students.map((s) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          sport: s.enrollments[0]?.group?.name || 'General',
          balance: s.charges.reduce((acc, c) => acc + Number(c.balance), 0),
          status: s.isActive ? 'ACTIVE' : 'INACTIVE',
        })),
        totalBalance,
        totalCredits,
        contacts: f.contacts,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      };
    });
  }

  async findOne(academyId: string, id: string) {
    const family = await this.prisma.family.findFirst({
      where: { id, academyId },
      include: {
        contacts: true,
        students: {
          include: {
            enrollments: {
              include: { group: true },
            },
          },
        },
        charges: {
          include: { allocations: true },
          orderBy: { dueDate: 'desc' },
        },
        payments: {
          include: { allocations: true },
          orderBy: { paidAt: 'desc' },
        },
        credits: true,
      },
    });

    if (!family) {
      throw new NotFoundException(`Familia con ID ${id} no encontrada`);
    }

    return family;
  }

  async create(academyId: string, dto: CreateFamilyDto) {
    const family = await this.prisma.family.create({
      data: {
        academyId,
        name: dto.name,
        code: dto.code || null,
        notes: dto.notes || null,
        contacts: dto.contacts
          ? {
              create: dto.contacts.map((c) => ({
                fullName: c.fullName,
                phone: c.phone,
                email: c.email || null,
                relationship: c.relationship || 'APODERADO',
                documentNumber: c.documentNumber || null,
                isPrimary: c.isPrimary !== undefined ? c.isPrimary : false,
              })),
            }
          : undefined,
      },
      include: { contacts: true },
    });

    this.logger.log(` Familia creada: ${family.name} (${family.id}) en academia ${academyId}`);
    return this.findOne(academyId, family.id);
  }

  async update(academyId: string, id: string, dto: UpdateFamilyDto) {
    await this.findOne(academyId, id);

    await this.prisma.family.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        notes: dto.notes,
      },
    });

    return this.findOne(academyId, id);
  }

  async remove(academyId: string, id: string) {
    await this.findOne(academyId, id);
    await this.prisma.family.delete({ where: { id } });
    return { success: true, message: `Familia ${id} eliminada correctamente` };
  }
}
