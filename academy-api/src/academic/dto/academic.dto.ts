import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSportDto {
  @ApiProperty({ example: 'Fútbol' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Entrenamiento formativo y competitivo' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class ScheduleItemDto {
  @ApiProperty({ example: 1, description: '1 (Lunes) a 7 (Domingo)' })
  @IsNumber()
  dayOfWeek: number;

  @ApiProperty({ example: '16:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:30' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 'Cancha Sintética 1' })
  @IsString()
  @IsOptional()
  court?: string;
}

export class CreateGroupDto {
  @ApiProperty({ example: 'Sub-10 Formativo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'sport-id' })
  @IsString()
  @IsNotEmpty()
  sportId: string;

  @ApiPropertyOptional({ example: 8 })
  @IsNumber()
  @IsOptional()
  minAge?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  maxAge?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coachId?: string;

  @ApiPropertyOptional({ type: [ScheduleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  @IsOptional()
  schedules?: ScheduleItemDto[];
}

export class CreateSessionDto {
  @ApiProperty({ example: 'grp-sub10-01' })
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  sessionDate: string;

  @ApiProperty({ example: '16:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:30' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 'Cancha 1' })
  @IsString()
  @IsOptional()
  court?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coachId?: string;
}

export class AttendanceRecordItemDto {
  @ApiProperty({ example: 'student-id' })
  @IsString()
  studentId: string;

  @ApiProperty({ example: 'PRESENT', enum: ['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED'] })
  @IsString()
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED';

  @ApiPropertyOptional({ example: 'Llegó 10 minutos tarde con justificativo' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class SaveAttendanceDto {
  @ApiProperty({ type: [AttendanceRecordItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordItemDto)
  records: AttendanceRecordItemDto[];
}
