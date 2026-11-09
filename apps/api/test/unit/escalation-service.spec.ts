import { EscalationService } from '../../src/modules/escalation/escalation.service';
import { ComplaintStatus } from '@esushrut/shared';

describe('EscalationService (Unit)', () => {
  let service: EscalationService;
  let mockPrisma: any;
  let mockSms: any;
  let mockAudit: any;

  beforeEach(() => {
    mockPrisma = {
      complaintTicket: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      escalationMatrix: {
        findFirst: jest.fn(),
      },
      complaintHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback({
          complaintTicket: { update: jest.fn() },
          complaintHistory: { create: jest.fn() },
        });
      }),
    };

    mockSms = {
      sendSms: jest.fn().mockResolvedValue(true),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(true),
    };

    service = new EscalationService(mockPrisma, mockSms, mockAudit);
  });

  it('should auto-escalate complaints past SLA deadline to next level officer', async () => {
    const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
    mockPrisma.complaintTicket.findMany.mockResolvedValue([
      {
        id: 'ticket-1',
        ticketId: 'FB-2026-000005',
        departmentId: 'dept-1',
        currentEscalationLevel: 1,
        status: ComplaintStatus.OPEN,
        slaDeadline: pastDate,
        department: { name: 'OPD' },
      },
    ]);

    mockPrisma.escalationMatrix.findFirst.mockResolvedValue({
      level: 2,
      slaHours: 48,
      escalateToUserId: 'head-user-id',
      escalateToUser: { fullName: 'Dr. Head', mobile: '9811223344' },
    });

    const res = await service.processSlaEscalations();

    expect(res.processedCount).toBe(1);
    expect(res.escalatedTickets).toContain('FB-2026-000005');
    expect(mockSms.sendSms).toHaveBeenCalledWith(
      '9811223344',
      expect.stringContaining('has breached SLA and is escalated to you'),
    );
  });
});
