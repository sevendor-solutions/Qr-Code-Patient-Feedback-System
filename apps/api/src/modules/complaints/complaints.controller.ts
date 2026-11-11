import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { Request } from 'express';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { validateImageMagicBytes } from '../../common/utils/file-validator';
import {
  SubmitComplaintSchema,
  UpdateComplaintStatusSchema,
  TrackComplaintSchema,
  ComplaintFilterSchema,
} from '@esushrut/shared';

const UPLOAD_DIR = './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('Complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Public()
  @Post('submit')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit a patient complaint with optional photo' })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          cb(null, `complaint-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    }),
  )
  async submitComplaint(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    let photoUrl: string | undefined;

    if (file) {
      // Validate MIME + Magic Bytes for security
      try {
        validateImageMagicBytes(file.path, file.mimetype, 5 * 1024 * 1024);
        photoUrl = `/uploads/${file.filename}`;
      } catch (err: any) {
        throw new BadRequestException(err.message || 'Invalid uploaded file');
      }
    }

    const validated = SubmitComplaintSchema.parse(body);
    const ip =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.complaintsService.submitComplaint(validated as any, photoUrl, ip, userAgent);
  }

  @Public()
  @Get('track')
  @ApiOperation({ summary: 'Track complaint status by Ticket ID and Mobile number' })
  async trackComplaint(@Query() query: any) {
    const validated = TrackComplaintSchema.parse(query);
    return this.complaintsService.trackComplaint(validated.ticketId, validated.mobile);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'List complaint tickets with filtering and pagination' })
  async getComplaints(@Query() query: any) {
    const validated = ComplaintFilterSchema.parse(query);
    return this.complaintsService.getComplaints(validated);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get complaint details and timeline by ID' })
  async getComplaintById(@Param('id') id: string) {
    return this.complaintsService.getComplaintById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update complaint status, assign officer, and add remarks' })
  async updateComplaintStatus(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    const validated = UpdateComplaintStatusSchema.parse(body);
    const ip =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.complaintsService.updateComplaintStatus(id, validated as any, userId, ip, userAgent);
  }
}
