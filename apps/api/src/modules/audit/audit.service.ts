import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  entityName: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      const detailsStr = params.details
        ? typeof params.details === 'string'
          ? params.details
          : JSON.stringify(params.details)
        : null;

      const record = await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entityName: params.entityName,
          entityId: params.entityId,
          details: detailsStr,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          createdBy: params.userId || 'SYSTEM',
        },
      });

      this.logger.debug(`Audit: [${params.action}] ${params.entityName} ${params.entityId || ''}`);
      return record;
    } catch (err: any) {
      this.logger.error(`Failed to write audit log: ${err.message}`, err.stack);
    }
  }

  async getLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, fullName: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
