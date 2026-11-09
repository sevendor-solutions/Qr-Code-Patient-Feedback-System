import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { SmsNotificationService } from '../notifications/sms.service';
import { AuditService } from '../audit/audit.service';
import { ComplaintStatus, CreateEscalationMatrixSchema } from '@esushrut/shared';
import { z } from 'zod';

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsNotificationService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(departmentId?: string) {
    return this.prisma.escalationMatrix.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: { select: { id: true, name: true, code: true } },
        escalateToUser: { select: { id: true, fullName: true, role: true, email: true, mobile: true } },
      },
      orderBy: [{ departmentId: 'asc' }, { level: 'asc' }],
    });
  }

  async create(data: z.infer<typeof CreateEscalationMatrixSchema>, userId?: string) {
    return this.prisma.escalationMatrix.create({
      data: {
        departmentId: data.departmentId,
        level: data.level,
        slaHours: data.slaHours,
        escalateToUserId: data.escalateToUserId,
        isActive: data.isActive,
        createdBy: userId || 'SYSTEM',
      },
    });
  }

  async update(id: string, data: Partial<z.infer<typeof CreateEscalationMatrixSchema>>) {
    const existing = await this.prisma.escalationMatrix.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Escalation rule with ID ${id} not found`);
    }

    return this.prisma.escalationMatrix.update({
      where: { id },
      data: {
        ...(data.slaHours ? { slaHours: data.slaHours } : {}),
        ...(data.escalateToUserId ? { escalateToUserId: data.escalateToUserId } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  /**
   * Evaluates all open/in-progress complaints and auto-escalates those that breached SLA deadlines
   */
  async processSlaEscalations(): Promise<{ processedCount: number; escalatedTickets: string[] }> {
    const now = new Date();
    const breachedTickets = await this.prisma.complaintTicket.findMany({
      where: {
        status: { in: [ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS] },
        slaDeadline: { lt: now },
      },
      include: {
        department: true,
        assignedTo: true,
      },
    });

    const escalatedTickets: string[] = [];

    for (const ticket of breachedTickets) {
      const nextLevel = ticket.currentEscalationLevel + 1;
      const nextMatrix = await this.prisma.escalationMatrix.findFirst({
        where: {
          departmentId: ticket.departmentId,
          level: nextLevel,
          isActive: true,
        },
        include: { escalateToUser: true },
      });

      const previousStatus = ticket.status;
      const nowEscalated = new Date();

      if (nextMatrix) {
        const nextDeadline = new Date(nowEscalated.getTime() + nextMatrix.slaHours * 3600 * 1000);
        await this.prisma.$transaction(async (tx) => {
          await tx.complaintTicket.update({
            where: { id: ticket.id },
            data: {
              status: ComplaintStatus.ESCALATED,
              currentEscalationLevel: nextLevel,
              assignedToId: nextMatrix.escalateToUserId,
              escalatedAt: nowEscalated,
              slaDeadline: nextDeadline,
            },
          });

          await tx.complaintHistory.create({
            data: {
              ticketId: ticket.id,
              fromStatus: previousStatus,
              toStatus: ComplaintStatus.ESCALATED,
              actionRemarks: `[SLA CRON AUTO-ESCALATION] Complaint exceeded SLA deadline. Auto-escalated from Level ${ticket.currentEscalationLevel} to Level ${nextLevel} (Officer: ${nextMatrix.escalateToUser.fullName}). Next SLA: ${nextMatrix.slaHours}h.`,
            },
          });
        });

        // Notify escalated officer
        if (nextMatrix.escalateToUser.mobile) {
          const alertMsg = `ESCALATION ALERT: Ticket ${ticket.ticketId} (${ticket.department.name}) has breached SLA and is escalated to you.`;
          await this.smsService.sendSms(nextMatrix.escalateToUser.mobile, alertMsg);
        }
      } else {
        // Highest level already reached, mark as ESCALATED
        await this.prisma.$transaction(async (tx) => {
          await tx.complaintTicket.update({
            where: { id: ticket.id },
            data: {
              status: ComplaintStatus.ESCALATED,
              escalatedAt: nowEscalated,
            },
          });

          await tx.complaintHistory.create({
            data: {
              ticketId: ticket.id,
              fromStatus: previousStatus,
              toStatus: ComplaintStatus.ESCALATED,
              actionRemarks: `[SLA CRON AUTO-ESCALATION] Complaint exceeded SLA deadline at highest configured tier Level ${ticket.currentEscalationLevel}. Critical pending review.`,
            },
          });
        });
      }

      await this.auditService.log({
        action: 'SLA_AUTO_ESCALATION',
        entityName: 'ComplaintTicket',
        entityId: ticket.id,
        details: {
          ticketId: ticket.ticketId,
          fromStatus: previousStatus,
          toLevel: nextMatrix ? nextLevel : ticket.currentEscalationLevel,
        },
      });

      escalatedTickets.push(ticket.ticketId);
      this.logger.warn(`Ticket ${ticket.ticketId} auto-escalated due to SLA breach.`);
    }

    return {
      processedCount: breachedTickets.length,
      escalatedTickets,
    };
  }
}
