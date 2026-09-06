import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(academyId: string, search?: string) {
    const where: Prisma.StudentWhereInput = {
      academyId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { documentNumber: { contains: search } },
            ],
          }
        : {}),
    };

    const students = await this.prisma.student.findMany({
      where,
      include: {
        family: {
          include: {
            contacts: true,
          },
        },
        enrollments: {
          where: { isActive: true },
          include: {
            group: {
              include: {
                sport: true,
              },
            },
          },
        },
        charges: {
          where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
        },
        participations: {
          include: {
            attendance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return students.map((s) => {
      const activeEnrollment = s.enrollments[0] || null;
      const group = activeEnrollment?.group || null;
      const primaryContact = s.family?.contacts?.find((c) => c.isPrimary) || s.family?.contacts?.[0] || null;

      // Calcular deuda total pendiente
      const totalBalance = s.charges.reduce((acc, c) => acc + Number(c.balance), 0);

      // Calcular tasa de asistencia
      const totalParticipations = s.participations.length;
      const presentCount = s.participations.filter(
        (p) => p.attendance?.status === 'PRESENT' || p.attendance?.status === 'LATE'
      ).length;
      const attendanceRate = totalParticipations > 0 ? Math.round((presentCount / totalParticipations) * 100) : 100;

      // Calcular edad
      const age = s.birthDate
        ? Math.floor((Date.now() - new Date(s.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
        : 10;

      return {
        id: s.id,
        academyId: s.academyId,
        name: `${s.firstName} ${s.lastName}`.trim(),
        firstName: s.firstName,
        lastName: s.lastName,
        birthDate: s.birthDate.toISOString().split('T')[0],
        age,
        documentType: s.documentType || 'DNI',
        documentNumber: s.documentNumber || '',
        emergencyPhone: s.emergencyPhone || primaryContact?.phone || '',
        medicalNotes: s.medicalNotes || '',
        familyId: s.familyId || '',
        familyName: s.family?.name || `Familia ${s.lastName}`,
        contactName: primaryContact?.fullName || `${s.firstName} ${s.lastName}`,
        phone: primaryContact?.phone || s.emergencyPhone || '',
        email: primaryContact?.email || '',
        sport: group?.sport?.name || 'Fútbol',
        groupName: group?.name || 'Sin asignar',
        groupId: group?.id || null,
        status: s.isActive ? 'ACTIVE' : 'INACTIVE',
        monthlyFee: activeEnrollment ? Number(activeEnrollment.monthlyFee) : 150.0,
        finalMonthlyFee: activeEnrollment ? Number(activeEnrollment.monthlyFee) : 150.0,
        balance: totalBalance,
        attendanceRate,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });
  }

  async findOne(academyId: string, id: string) {
    const s = await this.prisma.student.findFirst({
      where: { id, academyId },
      include: {
        family: {
          include: {
            contacts: true,
            charges: true,
            payments: true,
          },
        },
        enrollments: {
          include: {
            group: {
              include: {
                sport: true,
                schedules: true,
              },
            },
          },
        },
        charges: {
          include: {
            allocations: true,
          },
          orderBy: { dueDate: 'desc' },
        },
        participations: {
          include: {
            session: true,
            attendance: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        packageCredits: true,
        trials: true,
      },
    });

    if (!s) {
      throw new NotFoundException(`Alumno con ID ${id} no encontrado`);
    }

    return s;
  }

  async create(academyId: string, dto: CreateStudentDto) {
    let familyId = dto.familyId;

    // Si no tiene familia asignada, crear o vincular una familia por defecto
    if (!familyId) {
      const familyName = `Familia ${dto.lastName}`;
      const family = await this.prisma.family.create({
        data: {
          academyId,
          name: familyName,
          contacts: {
            create: {
              fullName: dto.contactName || `${dto.firstName} ${dto.lastName} (Apoderado)`,
              phone: dto.contactPhone || dto.emergencyPhone || '+51 987 654 321',
              email: dto.contactEmail || null,
              relationship: 'PADRE',
              isPrimary: true,
            },
          },
        },
      });
      familyId = family.id;
    }

    const student = await this.prisma.student.create({
      data: {
        academyId,
        familyId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        birthDate: new Date(dto.birthDate),
        documentType: dto.documentType || 'DNI',
        documentNumber: dto.documentNumber || null,
        emergencyPhone: dto.emergencyPhone || dto.contactPhone || null,
        medicalNotes: dto.medicalNotes || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    // Si se especificó un grupo, matricular al alumno en el grupo
    if (dto.groupId) {
      const fee = new Prisma.Decimal(dto.monthlyFee || 150.0);
      await this.prisma.enrollment.create({
        data: {
          academyId,
          studentId: student.id,
          groupId: dto.groupId,
          startDate: new Date(),
          isActive: true,
          monthlyFee: fee,
        },
      });

      // Crear cargo inicial de mensualidad
      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 28);
      await this.prisma.charge.create({
        data: {
          academyId,
          studentId: student.id,
          familyId,
          chargeType: 'MONTHLY',
          description: `Cuota Mensual - ${student.firstName} ${student.lastName}`,
          dueDate,
          originalAmount: fee,
          totalAmount: fee,
          paidAmount: new Prisma.Decimal(0),
          balance: fee,
          status: 'PENDING',
        },
      });
    }

    this.logger.log(` Alumno creado: ${student.firstName} ${student.lastName} (${student.id}) en academia ${academyId}`);
    return this.findOne(academyId, student.id);
  }

  async update(academyId: string, id: string, dto: UpdateStudentDto) {
    await this.findOne(academyId, id);

    const updateData: Prisma.StudentUpdateInput = {};
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.birthDate) updateData.birthDate = new Date(dto.birthDate);
    if (dto.documentType) updateData.documentType = dto.documentType;
    if (dto.documentNumber !== undefined) updateData.documentNumber = dto.documentNumber;
    if (dto.emergencyPhone !== undefined) updateData.emergencyPhone = dto.emergencyPhone;
    if (dto.medicalNotes !== undefined) updateData.medicalNotes = dto.medicalNotes;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    await this.prisma.student.update({
      where: { id },
      data: updateData,
    });

    // Si cambió de grupo o cuota mensual, actualizar la matrícula activa
    if (dto.groupId) {
      await this.prisma.enrollment.updateMany({
        where: { studentId: id, isActive: true },
        data: { isActive: false },
      });

      await this.prisma.enrollment.create({
        data: {
          academyId,
          studentId: id,
          groupId: dto.groupId,
          startDate: new Date(),
          isActive: true,
          monthlyFee: new Prisma.Decimal(dto.monthlyFee || 150.0),
        },
      });
    }

    return this.findOne(academyId, id);
  }

  async remove(academyId: string, id: string) {
    await this.findOne(academyId, id);
    // Soft delete para mantener integridad de cobros e historial
    await this.prisma.student.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, message: `Alumno ${id} desactivado correctamente` };
  }
}
