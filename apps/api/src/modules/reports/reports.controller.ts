import { Controller, Get, Query, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@esushrut/shared';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_HEAD, UserRole.FEEDBACK_OFFICER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get comprehensive feedback, complaint, and NPS metrics' })
  async getSummary(
    @Query('hospitalId') hospitalId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getReportsSummary({
      hospitalId,
      departmentId,
      startDate,
      endDate,
    });
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export reports data to Excel (.xlsx)' })
  async exportExcel(@Query() query: any, @Res() res: Response) {
    const buffer = await this.reportsService.exportExcel(query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="esushrut-feedback-report.xlsx"',
    );
    res.status(HttpStatus.OK).send(buffer);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Export reports data to printable PDF' })
  async exportPdf(@Query() query: any, @Res() res: Response) {
    const buffer = await this.reportsService.exportPdf(query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="esushrut-quality-report.pdf"',
    );
    res.status(HttpStatus.OK).send(buffer);
  }
}
