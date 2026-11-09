import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { QrService } from './qr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  GenerateQrSchema,
  BulkQrPrintSchema,
  UserRole,
} from '@esushrut/shared';

@ApiTags('QR Management')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new QR code for department/counter' })
  async generateQr(@Body() body: any, @CurrentUser('id') userId: string) {
    const validated = GenerateQrSchema.parse(body);
    return this.qrService.generateQr(
      validated.hospitalId,
      validated.departmentId,
      validated.locationId,
      validated.counterName,
      userId,
    );
  }

  @Public()
  @Get('verify')
  @ApiOperation({ summary: 'Verify QR token signature validity' })
  async verifyQr(
    @Query('h') hospitalId: string,
    @Query('d') departmentId: string,
    @Query('loc') locationId: string,
    @Query('t') token: string,
  ) {
    const isValid = await this.qrService.verifyToken(hospitalId, departmentId, locationId, token);
    return { valid: isValid };
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List generated QR codes' })
  async listQrs(
    @Query('hospitalId') hospitalId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.qrService.listQrs(hospitalId, departmentId);
  }

  @Post('bulk-print')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download multi-page printable A4 PDF of QR Standees' })
  async downloadBulkPrint(@Body() body: any, @Res() res: Response) {
    const validated = BulkQrPrintSchema.parse(body);
    const pdfBuffer = await this.qrService.generateBulkPdf(
      validated.hospitalId,
      validated.departmentIds,
      validated.includeTelugu,
      validated.includeHindi,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="esushrut-qr-standees.pdf"');
    res.status(HttpStatus.OK).send(pdfBuffer);
  }
}
