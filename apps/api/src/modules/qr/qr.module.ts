import { Module } from '@nestjs/common';
import { QrService } from './qr.service';
import { QrController } from './qr.controller';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [QrController, LocationsController],
  providers: [QrService, LocationsService, PrismaService],
  exports: [QrService, LocationsService],
})
export class QrModule {}
