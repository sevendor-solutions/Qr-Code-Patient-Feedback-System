import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { PrismaService } from '../../common/services/prisma.service';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [QrModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, PrismaService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
