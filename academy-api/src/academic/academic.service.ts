import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateSportDto,
  CreateGroupDto,
  CreateSessionDto,
  SaveAttendanceDto,
} from './dto/academic.dto';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // DEPORTES (SPORTS)
  // ==========================================
  async getSports(academyId: string) {
    const sports = await this.prisma.sport.findMany({
      where: { academyId, isActive: true },
      include: {
        _count: {
          select: { groups: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return sports.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || '',
      groupsCount: s._count.groups,
      isActive: s.isActive,
    }));
  }

  async createSport(academyId: string, dto: CreateSportDto) {
    return await this.prisma.sport.create({
      data: {
        academyId,
        name: dto.name,
        description: dto.description || null,
        isActive: true,
      },
    });
  }

  // ==========================================
  // GRUPOS & CATEGORÍAS (GROUPS & SCHEDULES)
  // ==========================================
  async getGroups(academyId: string) {
    const groups = await this.prisma.group.findMany({
      where: { academyId, isActive: true },
      include: {
        sport: true,
        schedules: true,
        enrollments: {
          where: { isActive: true },
          include: { student: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return groups.map((g) => {
      const schedule = g.schedules[0] || null;
      const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const days = g.schedules.map((s) => dayNames[s.dayOfWeek - 1] || 'Lunes');

      return {
        id: g.id,
        academyId: g.academyId,
        sport: g.sport?.name || 'Fútbol',
        name: g.name,
        coachId: g.coachId || 'usr-coach',
        coachName: 'Prof. Valeria Gómez',
        court: schedule?.court || 'Cancha Principal',
        scheduleText: schedule ? `${days.join(', ')} • ${schedule.startTime} - ${schedule.endTime}` : 'Por definir',
        days,
        startTime: schedule?.startTime || '16:00',
        endTime: schedule?.endTime || '17:30',
        studentCount: g.enrollments.length,
        capacity: g.capacity || 20,
        isActive: g.isActive,
        schedules: g.schedules,
      };
    });
  }

  async createGroup(academyId: string, dto: CreateGroupDto) {
    return await this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          academyId,
          sportId: dto.sportId,
          name: dto.name,
          minAge: dto.minAge || null,
          maxAge: dto.maxAge || null,
          capacity: dto.capacity || 20,
          coachId: dto.coachId || null,
          isActive: true,
        },
      });

      if (dto.schedules && dto.schedules.length > 0) {
        await tx.schedule.createMany({
          data: dto.schedules.map((s) => ({
            academyId,
            groupId: group.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            court: s.court || null,
          })),
        });
      }

      return group;
    });
  }

  // ==========================================
  // SESIONES & ASISTENCIAS (SESSIONS & ATTENDANCE)
  // ==========================================
  async getSessions(academyId: string) {
    const sessions = await this.prisma.classSession.findMany({
      where: { academyId },
      include: {
        group: {
          include: {
            sport: true,
            enrollments: {
              where: { isActive: true },
              include: {
                student: {
                  include: {
                    family: {
                      include: { contacts: true },
                    },
                    charges: {
                      where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
                    },
                  },
                },
              },
            },
          },
        },
        participations: {
          include: {
            student: true,
            attendance: true,
          },
        },
      },
      orderBy: { sessionDate: 'desc' },
      take: 50,
    });

    return sessions.map((s) => {
      // Mapear alumnos inscritos con su estado de asistencia registrado o pendiente
      const attendanceMap = new Map(
        s.participations.map((p) => [
          p.studentId,
          {
            status: p.attendance?.status || 'PRESENT',
            checkInTime: p.attendance?.checkInTime?.toISOString().split('T')[1]?.slice(0, 5) || s.startTime,
            remarks: p.attendance?.remarks || '',
          },
        ])
      );

      const studentsList = s.group.enrollments.map((e) => {
        const student = e.student;
        const record = attendanceMap.get(student.id);
        const contact = student.family?.contacts[0] || null;
        const totalDebt = student.charges.reduce((acc, c) => acc + Number(c.balance), 0);

        return {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          status: (record?.status || 'PRESENT') as any,
          checkInTime: record?.checkInTime || s.startTime,
          remarks: record?.remarks || '',
          phone: contact?.phone || student.emergencyPhone || '',
          familyDebt: totalDebt,
          hasDebt: totalDebt > 0,
          participationType: 'REGULAR' as const,
        };
      });

      const totalPresent = studentsList.filter((st) => st.status === 'PRESENT' || st.status === 'LATE').length;
      const totalAbsent = studentsList.filter((st) => st.status === 'ABSENT').length;

      const attendancesList = s.group.enrollments.map((e) => {
        const student = e.student;
        const record = attendanceMap.get(student.id);
        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          documentNumber: student.documentNumber || '',
          status: (record?.status || 'PRESENT') as any,
          participationType: 'REGULAR' as const,
          checkInTime: record?.checkInTime || s.startTime,
          remarks: record?.remarks || '',
          justificationReason: '',
        };
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const sessionDateStr = s.sessionDate.toISOString().split('T')[0];

      return {
        id: s.id,
        academyId: s.academyId,
        groupId: s.groupId,
        groupName: s.group.name,
        sport: s.group.sport?.name || 'Fútbol',
        coachName: 'Prof. Valeria Gómez',
        date: sessionDateStr,
        time: `${s.startTime} - ${s.endTime}`,
        startTime: s.startTime,
        endTime: s.endTime,
        court: s.court || 'Cancha Principal',
        totalStudents: studentsList.length,
        presentCount: totalPresent,
        absentCount: totalAbsent,
        isToday: sessionDateStr === todayStr,
        status: s.participations.length > 0 ? ('COMPLETED' as const) : ('SCHEDULED' as const),
        isCompleted: s.participations.length > 0,
        notes: s.notes || '',
        students: studentsList,
        attendances: attendancesList,
      };
    });
  }

  async createSession(academyId: string, dto: CreateSessionDto) {
    const session = await this.prisma.classSession.create({
      data: {
        academyId,
        groupId: dto.groupId,
        sessionDate: new Date(dto.sessionDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        court: dto.court || null,
        coachId: dto.coachId || null,
      },
    });

    return session;
  }

  async saveAttendance(academyId: string, sessionId: string, dto: SaveAttendanceDto, recorderUserId?: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, academyId },
    });

    if (!session) {
      throw new NotFoundException(`Sesión ${sessionId} no encontrada`);
    }

    // Guardar o actualizar participaciones y asistencias en una transacción
    await this.prisma.$transaction(async (tx) => {
      for (const rec of dto.records) {
        // Buscar si ya existe la participación
        let participation = await tx.classParticipation.findFirst({
          where: { sessionId, studentId: rec.studentId },
        });

        if (!participation) {
          participation = await tx.classParticipation.create({
            data: {
              academyId,
              sessionId,
              studentId: rec.studentId,
              participationType: 'REGULAR',
            },
          });
        }

        // Upsert de asistencia
        await tx.attendance.upsert({
          where: { participationId: participation.id },
          create: {
            participationId: participation.id,
            status: rec.status as AttendanceStatus,
            checkInTime: new Date(),
            recordedById: recorderUserId || null,
            remarks: rec.remarks || null,
          },
          update: {
            status: rec.status as AttendanceStatus,
            checkInTime: new Date(),
            recordedById: recorderUserId || null,
            remarks: rec.remarks || null,
          },
        });
      }
    });

    this.logger.log(` Asistencia guardada para ${dto.records.length} alumnos en sesión ${sessionId}`);
    return { success: true, message: 'Asistencia registrada correctamente en la base de datos' };
  }
}
