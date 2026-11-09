import { Module } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { PrismaService } from '../../common/services/prisma.service';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [QrModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, PrismaService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
