import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { SmsNotificationService } from '../notifications/sms.service';
import { AuditService } from '../audit/audit.service';
import { QrService } from '../qr/qr.service';
import {
  SubmitFeedbackDto,
  maskMobile,
  sanitizeInput,
  formatTicketId,
} from '@esushrut/shared';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsNotificationService,
    private readonly auditService: AuditService,
    private readonly qrService: QrService,
  ) {}

  async submitFeedback(
    dto: SubmitFeedbackDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Verify HMAC QR token
    const isValidToken = await this.qrService.verifyToken(
      dto.hospitalId,
      dto.departmentId,
      dto.locationId,
      dto.qrToken,
    );

    if (!isValidToken) {
      throw new ForbiddenException('Invalid or tampered QR Code token.');
    }

    // 2. Business Rule: Max 3 submissions per mobile per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const submissionCountToday = await this.prisma.feedback.count({
      where: {
        mobile: dto.mobile,
        createdAt: { gte: todayStart },
      },
    });

    const maxLimit =
      this.configService.get<number>('DAILY_SUBMISSION_LIMIT_PER_MOBILE') || 3;
    if (submissionCountToday >= maxLimit) {
      throw new BadRequestException(
        `Daily limit exceeded. A mobile number can submit up to ${maxLimit} feedbacks per day.`,
      );
    }

    // 3. Hash IP for privacy/rate auditing
    const ipHash = ipAddress
      ? crypto.createHash('sha256').update(ipAddress).digest('hex').slice(0, 32)
      : undefined;

    // 4. Sanitize inputs
    const sanitizedComments = dto.comments ? sanitizeInput(dto.comments) : null;
    const sanitizedName = dto.patientName ? sanitizeInput(dto.patientName) : null;

    // 5. Compute average rating from ratings array
    const avgRating =
      dto.ratings.length > 0
        ? dto.ratings.reduce((acc, curr) => acc + curr.rating, 0) / dto.ratings.length
        : dto.overallEmoji;

    // 6. Find department & hospital details
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      include: { hospital: true },
    });

    if (!department) {
      throw new BadRequestException('Hospital department not found');
    }

    // 7. Store feedback and rating items in a transaction
    const feedback = await this.prisma.$transaction(async (tx) => {
      const fb = await tx.feedback.create({
        data: {
          hospitalId: dto.hospitalId,
          departmentId: dto.departmentId,
          locationId: dto.locationId || null,
          language: dto.language,
          patientName: sanitizedName,
          mobile: dto.mobile,
          crNumber: dto.crNumber ? sanitizeInput(dto.crNumber) : null,
          patientType: dto.patientType as any,
          overallEmoji: dto.overallEmoji,
          npsScore: dto.npsScore,
          comments: sanitizedComments,
          ipHash,
          userAgent: userAgent ? userAgent.slice(0, 450) : null,
          ratings: {
            create: dto.ratings.map((r) => ({
              category: r.category as any,
              rating: r.rating,
            })),
          },
        },
        include: {
          ratings: true,
          department: true,
          hospital: true,
        },
      });

      // Update scan count if qrMasterId exists or can be matched
      await tx.qrMaster.updateMany({
        where: {
          hospitalId: dto.hospitalId,
          departmentId: dto.departmentId,
        },
        data: {
          scanCount: { increment: 1 },
        },
      });

      return fb;
    });

    // 8. Generate acknowledgment Ticket ID (FB-YYYY-NNNNNN)
    const countTotal = await this.prisma.feedback.count();
    const currentYear = new Date().getFullYear();
    const ticketId = formatTicketId(currentYear, countTotal);

    // 9. Send SMS Acknowledgement to Patient
    await this.smsService.sendFeedbackAcknowledgement(
      dto.mobile,
      ticketId,
      department.name,
    );

    // 10. Business Rule: Rating <= 2 -> notify department in-charge immediately
    if (avgRating <= 2 || dto.overallEmoji <= 2) {
      await this.smsService.sendLowRatingAlert(
        department.headEmail,
        department.headPhone,
        department.name,
        Math.round(avgRating * 10) / 10,
        maskMobile(dto.mobile),
      );
    }

    await this.auditService.log({
      action: 'SUBMIT_FEEDBACK',
      entityName: 'Feedback',
      entityId: feedback.id,
      details: {
        ticketId,
        department: department.name,
        avgRating,
        npsScore: dto.npsScore,
        overallEmoji: dto.overallEmoji,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      ticketId,
      feedbackId: feedback.id,
      message: 'Thank you for your feedback! Your response has been submitted successfully.',
    };
  }

  async getFeedbacks(params: {
    page?: number;
    limit?: number;
    hospitalId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    minRating?: number;
    maxRating?: number;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.hospitalId) where.hospitalId = params.hospitalId;
    if (params.departmentId) where.departmentId = params.departmentId;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    if (params.minRating || params.maxRating) {
      where.overallEmoji = {};
      if (params.minRating) where.overallEmoji.gte = Number(params.minRating);
      if (params.maxRating) where.overallEmoji.lte = Number(params.maxRating);
    }

    if (params.search) {
      where.OR = [
        { patientName: { contains: params.search, mode: 'insensitive' } },
        { mobile: { contains: params.search } },
        { crNumber: { contains: params.search, mode: 'insensitive' } },
        { comments: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rawFeedbacks, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true, code: true } },
          hospital: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, ward: true, floor: true, counter: true } },
          ratings: true,
        },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    // Mask mobile numbers according to Privacy Business Rule
    const feedbacks = rawFeedbacks.map((fb) => ({
      ...fb,
      mobile: maskMobile(fb.mobile),
    }));

    return {
      items: feedbacks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFeedbackById(id: string) {
    const fb = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        department: true,
        hospital: true,
        location: true,
        ratings: true,
      },
    });

    if (!fb) {
      throw new BadRequestException('Feedback record not found');
    }

    return {
      ...fb,
      mobile: maskMobile(fb.mobile),
    };
  }
}
