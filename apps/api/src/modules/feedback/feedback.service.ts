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
  PatientType,
  RatingCategory,
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
    // 1. Resolve Hospital and Department
    let hospitalId = dto.hospitalId;
    let departmentId = dto.departmentId;

    if (!hospitalId || !departmentId) {
      const defaultHospital = await this.prisma.hospital.findFirst({
        where: { isActive: true },
        include: { departments: true },
      });
      if (!defaultHospital) {
        throw new BadRequestException('Hospital not found in system.');
      }
      hospitalId = hospitalId || defaultHospital.id;
      const isIpd =
        dto.service?.toUpperCase() === 'IPD' ||
        dto.patientType === PatientType.IPD;
      const deptCode = isIpd ? 'IPD' : 'OPD';
      const targetDept =
        defaultHospital.departments.find((d) => d.code === deptCode) ||
        defaultHospital.departments[0];
      departmentId = departmentId || targetDept.id;
    }

    // 2. Verify HMAC QR token if provided
    if (dto.qrToken) {
      const isValidToken = await this.qrService.verifyToken(
        hospitalId,
        departmentId,
        dto.locationId,
        dto.qrToken,
      );

      if (!isValidToken) {
        throw new ForbiddenException('Invalid or tampered QR Code token.');
      }
    }

    // 3. Resolve Mobile & Rate Limiting
    const rawMobile = dto.mobile?.trim();
    const mobile = rawMobile || '9999999999';

    if (mobile !== '9999999999') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const submissionCountToday = await this.prisma.feedback.count({
        where: {
          mobile,
          createdAt: { gte: todayStart },
        },
      });

      const maxLimit =
        this.configService.get<number>('DAILY_SUBMISSION_LIMIT_PER_MOBILE') || 10;
      if (submissionCountToday >= maxLimit) {
        throw new BadRequestException(
          `Daily limit exceeded. A mobile number can submit up to ${maxLimit} feedbacks per day.`,
        );
      }
    }

    // 4. Hash IP for privacy/rate auditing
    const ipHash = ipAddress
      ? crypto.createHash('sha256').update(ipAddress).digest('hex').slice(0, 32)
      : undefined;

    // 5. Patient details & comments assembly
    const patientName = dto.patientName || dto.patient || undefined;
    const crNumber = dto.crNumber || dto.ticket || undefined;
    const patientType =
      dto.service?.toUpperCase() === 'IPD' || dto.patientType === PatientType.IPD
        ? PatientType.IPD
        : PatientType.OPD;

    const commentParts: string[] = [];
    if (dto.comments) commentParts.push(dto.comments.trim());
    if (dto.ward) commentParts.push(`Ward: ${dto.ward.trim()}`);
    if (dto.ticket) commentParts.push(`Ticket: ${dto.ticket.trim()}`);
    if (dto.date) commentParts.push(`Visit Date: ${dto.date}`);
    if (dto.answers && dto.answers.length > 0) {
      commentParts.push(`Answers: [${dto.answers.join(', ')}]`);
    }
    const combinedComments = commentParts.length > 0 ? commentParts.join(' | ') : null;
    const sanitizedComments = combinedComments ? sanitizeInput(combinedComments) : null;
    const sanitizedName = patientName ? sanitizeInput(patientName) : null;

    // 6. Compute ratings array and summary metrics
    const categoryMap = new Map<RatingCategory, number>();

    if (dto.ratings && dto.ratings.length > 0) {
      for (const r of dto.ratings) {
        categoryMap.set(r.category as RatingCategory, r.rating);
      }
    }

    if (dto.answers && dto.answers.length > 0) {
      const a = dto.answers;
      if (a[0] !== undefined) categoryMap.set(RatingCategory.REGISTRATION, a[0]);
      if (a[1] !== undefined) categoryMap.set(RatingCategory.WAITING_TIME, a[1]);
      if (a[2] !== undefined) categoryMap.set(RatingCategory.STAFF_BEHAVIOUR, a[2]);
      if (a[3] !== undefined) categoryMap.set(RatingCategory.CLEANLINESS, a[3]);
      if (a[4] !== undefined) categoryMap.set(RatingCategory.DOCTOR, a[4]);
      if (a[6] !== undefined) categoryMap.set(RatingCategory.LAB, a[6]);
      if (a[7] !== undefined) categoryMap.set(RatingCategory.PHARMACY, a[7]);
      if (a[9] !== undefined) categoryMap.set(RatingCategory.BILLING, a[9]);
      if (a[13] !== undefined) categoryMap.set(RatingCategory.NURSING, a[13]);
    }

    const uniqueRatings = Array.from(categoryMap.entries()).map(([category, rating]) => ({
      category,
      rating,
    }));

    let avgRating = 4;
    if (uniqueRatings.length > 0) {
      avgRating =
        uniqueRatings.reduce((acc, curr) => acc + curr.rating, 0) / uniqueRatings.length;
    } else if (dto.answers && dto.answers.length > 0) {
      avgRating =
        dto.answers.reduce((acc, curr) => acc + curr, 0) / dto.answers.length;
    }

    const overallEmoji =
      dto.overallEmoji || Math.max(1, Math.min(5, Math.round(avgRating)));
    const npsScore =
      dto.npsScore !== undefined
        ? dto.npsScore
        : Math.min(10, Math.max(0, Math.round((avgRating / 5) * 10)));

    // 7. Find department & hospital details
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: { hospital: true },
    });

    if (!department) {
      throw new BadRequestException('Hospital department not found');
    }

    // 8. Store feedback and rating items in a transaction
    const feedback = await this.prisma.$transaction(async (tx) => {
      const fb = await tx.feedback.create({
        data: {
          hospitalId,
          departmentId,
          locationId: dto.locationId || null,
          language: dto.language || 'or',
          patientName: sanitizedName,
          mobile,
          crNumber: crNumber ? sanitizeInput(crNumber) : null,
          patientType,
          overallEmoji,
          npsScore,
          comments: sanitizedComments,
          ipHash,
          userAgent: userAgent ? userAgent.slice(0, 450) : null,
          ratings: {
            create: uniqueRatings.map((r) => ({
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

      // Update scan count if qrMaster exists
      await tx.qrMaster.updateMany({
        where: {
          hospitalId,
          departmentId,
        },
        data: {
          scanCount: { increment: 1 },
        },
      });

      return fb;
    });

    // 9. Generate acknowledgment Ticket ID (FB-YYYY-NNNNNN)
    const countTotal = await this.prisma.feedback.count();
    const currentYear = new Date().getFullYear();
    const ticketId = formatTicketId(currentYear, countTotal);

    // 10. Send SMS Acknowledgement to Patient
    if (mobile !== '9999999999') {
      await this.smsService.sendFeedbackAcknowledgement(
        mobile,
        ticketId,
        department.name,
      );
    }

    // 11. Business Rule: Rating <= 2 -> notify department in-charge immediately
    if (avgRating <= 2 || overallEmoji <= 2) {
      await this.smsService.sendLowRatingAlert(
        department.headEmail,
        department.headPhone,
        department.name,
        Math.round(avgRating * 10) / 10,
        maskMobile(mobile),
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
