import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { SubmitFeedbackSchema, FeedbackFilterSchema } from '@esushrut/shared';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Public()
  @Post('submit')
  @ApiOperation({ summary: 'Submit patient feedback via QR code' })
  async submitFeedback(@Body() body: any, @Req() req: Request) {
    const validated = SubmitFeedbackSchema.parse(body);
    const ip =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.feedbackService.submitFeedback(validated, ip, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'List patient feedbacks with filtering & pagination' })
  async getFeedbacks(@Query() query: any) {
    const validated = FeedbackFilterSchema.parse(query);
    return this.feedbackService.getFeedbacks(validated);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get feedback details by ID' })
  async getFeedbackById(@Param('id') id: string) {
    return this.feedbackService.getFeedbackById(id);
  }
}
