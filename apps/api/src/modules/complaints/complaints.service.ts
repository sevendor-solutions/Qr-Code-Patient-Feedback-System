import {
  Injectable,
  BadRequestException,
  NotFoundException,
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
  SubmitComplaintDto,
  ComplaintStatusUpdateDto,
  ComplaintStatus,
  maskMobile,
  sanitizeInput,
  formatTicketId,
} from '@esushrut/shared';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsNotificationService,
    private readonly auditService: AuditService,
    private readonly qrService: QrService,
  ) {}

  async submitComplaint(
    dto: SubmitComplaintDto,
    photoUrl?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Verify QR token signature
    const isValidToken = await this.qrService.verifyToken(
      dto.hospitalId,
      dto.departmentId,
      dto.locationId,
      dto.qrToken,
    );

    if (!isValidToken) {
      throw new ForbiddenException('Invalid or tampered QR Code token.');
    }

    // 2. Business rule: Max 3 submissions per mobile per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const countToday = await this.prisma.complaintTicket.count({
      where: {
        mobile: dto.mobile,
        createdAt: { gte: todayStart },
      },
    });

    const maxLimit =
      this.configService.get<number>('DAILY_SUBMISSION_LIMIT_PER_MOBILE') || 3;
    if (countToday >= maxLimit) {
      throw new BadRequestException(
        `Daily limit exceeded. A mobile number can submit up to ${maxLimit} complaints/feedbacks per day.`,
      );
    }

    // 3. Department and Escalation Matrix lookup for initial SLA
    const [department, escalation] = await Promise.all([
      this.prisma.department.findUnique({ where: { id: dto.departmentId } }),
      this.prisma.escalationMatrix.findFirst({
        where: { departmentId: dto.departmentId, level: 1, isActive: true },
      }),
    ]);

    if (!department) {
      throw new BadRequestException('Hospital department not found');
    }

    const slaHours = escalation ? escalation.slaHours : 24;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000);

    // 4. Generate formatted ticket ID
    const countTotal = await this.prisma.complaintTicket.count();
    const currentYear = new Date().getFullYear();
    const ticketId = formatTicketId(currentYear, countTotal + 1);

    const ipHash = ipAddress
      ? crypto.createHash('sha256').update(ipAddress).digest('hex').slice(0, 32)
      : undefined;

    // 5. Create ComplaintTicket and initial ComplaintHistory in a transaction
    const complaint = await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.complaintTicket.create({
        data: {
          ticketId,
          hospitalId: dto.hospitalId,
          departmentId: dto.departmentId,
          locationId: dto.locationId || null,
          categoryId: dto.categoryId,
          language: dto.language,
          patientName: dto.patientName ? sanitizeInput(dto.patientName) : null,
          mobile: dto.mobile,
          crNumber: dto.crNumber ? sanitizeInput(dto.crNumber) : null,
          patientType: dto.patientType as any,
          description: sanitizeInput(dto.description),
          photoUrl: photoUrl || null,
          priority: dto.priority as any,
          status: ComplaintStatus.OPEN,
          assignedToId: escalation ? escalation.escalateToUserId : null,
          currentEscalationLevel: 1,
          slaDeadline,
          ipHash,
          userAgent: userAgent ? userAgent.slice(0, 450) : null,
        },
      });

      await tx.complaintHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: null,
          toStatus: ComplaintStatus.OPEN,
          actionRemarks: 'Grievance ticket created by patient via QR Code scan',
        },
      });

      return ticket;
    });

    // 6. Send SMS confirmation to patient
    await this.smsService.sendComplaintAcknowledgement(
      dto.mobile,
      ticketId,
      department.name,
    );

    // 7. Audit log
    await this.auditService.log({
      action: 'SUBMIT_COMPLAINT',
      entityName: 'ComplaintTicket',
      entityId: complaint.id,
      details: {
        ticketId,
        department: department.name,
        priority: dto.priority,
        slaDeadline,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      ticketId,
      complaintId: complaint.id,
      status: ComplaintStatus.OPEN,
      slaDeadline,
      message: `Your grievance has been registered successfully with Ticket ID: ${ticketId}. You will receive SMS updates.`,
    };
  }

  async trackComplaint(ticketId: string, mobile: string) {
    const complaint = await this.prisma.complaintTicket.findFirst({
      where: {
        ticketId: ticketId.trim(),
        mobile: mobile.trim(),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        hospital: { select: { id: true, name: true } },
        category: { select: { id: true, nameEn: true, nameTe: true, nameHi: true } },
        histories: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            actionRemarks: true,
            createdAt: true,
          },
        },
      },
    });

    if (!complaint) {
      throw new NotFoundException(
        'No matching ticket found for the provided Ticket ID and Mobile Number.',
      );
    }

    return {
      ticketId: complaint.ticketId,
      status: complaint.status,
      priority: complaint.priority,
      department: complaint.department.name,
      category: complaint.category.nameEn,
      description: complaint.description,
      createdAt: complaint.createdAt,
      resolvedAt: complaint.resolvedAt,
      closedAt: complaint.closedAt,
      slaDeadline: complaint.slaDeadline,
      timeline: complaint.histories,
    };
  }

  async getComplaints(params: {
    page?: number;
    limit?: number;
    hospitalId?: string;
    departmentId?: string;
    status?: ComplaintStatus;
    priority?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.hospitalId) where.hospitalId = params.hospitalId;
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority as any;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    if (params.search) {
      where.OR = [
        { ticketId: { contains: params.search, mode: 'insensitive' } },
        { patientName: { contains: params.search, mode: 'insensitive' } },
        { mobile: { contains: params.search } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rawTickets, total] = await Promise.all([
      this.prisma.complaintTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true, code: true } },
          hospital: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, code: true, nameEn: true } },
          assignedTo: { select: { id: true, fullName: true, username: true } },
        },
      }),
      this.prisma.complaintTicket.count({ where }),
    ]);

    const tickets = rawTickets.map((t) => ({
      ...t,
      mobile: maskMobile(t.mobile),
    }));

    return {
      items: tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getComplaintById(id: string) {
    const ticket = await this.prisma.complaintTicket.findUnique({
      where: { id },
      include: {
        department: true,
        hospital: true,
        category: true,
        location: true,
        assignedTo: { select: { id: true, fullName: true, username: true, email: true, mobile: true } },
        histories: {
          orderBy: { createdAt: 'desc' },
          include: {
            actionByUser: { select: { id: true, fullName: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Complaint ticket with ID ${id} not found`);
    }

    return {
      ...ticket,
      mobile: maskMobile(ticket.mobile),
    };
  }

  async updateComplaintStatus(
    id: string,
    dto: ComplaintStatusUpdateDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.complaintTicket.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!existing) {
      throw new NotFoundException(`Complaint ticket with ID ${id} not found`);
    }

    const sanitizedRemarks = sanitizeInput(dto.remarks);

    const updated = await this.prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {
        status: dto.status,
      };

      if (dto.assignedToId) {
        dataToUpdate.assignedToId = dto.assignedToId;
      }

      if (dto.status === ComplaintStatus.RESOLVED && !existing.resolvedAt) {
        dataToUpdate.resolvedAt = new Date();
      }

      if (dto.status === ComplaintStatus.CLOSED && !existing.closedAt) {
        dataToUpdate.closedAt = new Date();
      }

      const ticket = await tx.complaintTicket.update({
        where: { id },
        data: dataToUpdate,
        include: { assignedTo: true, department: true },
      });

      await tx.complaintHistory.create({
        data: {
          ticketId: id,
          fromStatus: existing.status,
          toStatus: dto.status,
          actionByUserId: userId,
          actionRemarks: sanitizedRemarks,
          createdBy: userId,
        },
      });

      return ticket;
    });

    // Notify patient of status update
    await this.smsService.sendComplaintStatusUpdate(
      existing.mobile,
      existing.ticketId,
      dto.status,
      sanitizedRemarks,
    );

    // Audit log
    await this.auditService.log({
      userId,
      action: 'UPDATE_COMPLAINT_STATUS',
      entityName: 'ComplaintTicket',
      entityId: id,
      details: {
        ticketId: existing.ticketId,
        fromStatus: existing.status,
        toStatus: dto.status,
        remarks: sanitizedRemarks,
        assignedToId: dto.assignedToId,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      ticket: {
        ...updated,
        mobile: maskMobile(updated.mobile),
      },
      message: `Ticket status successfully updated to ${dto.status}`,
    };
  }
}
