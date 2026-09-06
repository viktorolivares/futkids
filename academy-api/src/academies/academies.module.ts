import { Module } from '@nestjs/common';
import { AcademiesController } from './academies.controller';
import { AcademiesService } from './academies.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AcademiesController],
  providers: [AcademiesService],
  exports: [AcademiesService],
})
export class AcademiesModule {}
