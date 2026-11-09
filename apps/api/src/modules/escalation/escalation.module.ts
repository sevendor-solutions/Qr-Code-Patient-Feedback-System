import { Module } from '@nestjs/common';
import { EscalationService } from './escalation.service';
import { EscalationController } from './escalation.controller';
import { EscalationCronService } from './escalation.cron';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [EscalationController],
  providers: [EscalationService, EscalationCronService, PrismaService],
  exports: [EscalationService],
})
export class EscalationModule {}
