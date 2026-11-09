import { ComplaintsService } from '../../src/modules/complaints/complaints.service';
import { ComplaintPriority, ComplaintStatus, PatientType } from '@esushrut/shared';
import { NotFoundException } from '@nestjs/common';

describe('ComplaintsService (Unit)', () => {
  let service: ComplaintsService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockSms: any;
  let mockAudit: any;
  let mockQr: any;

  beforeEach(() => {
    mockPrisma = {
      complaintTicket: {
        count: jest.fn().mockImplementation((args) => {
          if (args?.where?.mobile) {
            return Promise.resolve(0); // Today's count under limit
          }
          return Promise.resolve(10); // Overall sequence count
        }),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      department: {
        findUnique: jest.fn().mockResolvedValue({ id: 'dept-1', name: 'Emergency Ward' }),
      },
      escalationMatrix: {
        findFirst: jest.fn().mockResolvedValue({ level: 1, slaHours: 24, escalateToUserId: 'officer-1' }),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback({
          complaintTicket: {
            create: jest.fn().mockResolvedValue({
              id: 'comp-uuid-1',
              ticketId: 'FB-2026-000011',
              mobile: '9876543210',
              status: ComplaintStatus.OPEN,
            }),
            update: jest.fn().mockResolvedValue({
              id: 'comp-uuid-1',
              ticketId: 'FB-2026-000011',
              mobile: '9876543210',
              status: ComplaintStatus.RESOLVED,
            }),
          },
          complaintHistory: {
            create: jest.fn().mockResolvedValue({ id: 'hist-1' }),
          },
        });
      }),
    };

    mockConfig = {
      get: jest.fn().mockReturnValue(3),
    };

    mockSms = {
      sendComplaintAcknowledgement: jest.fn().mockResolvedValue(true),
      sendComplaintStatusUpdate: jest.fn().mockResolvedValue(true),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(true),
    };

    mockQr = {
      verifyToken: jest.fn().mockResolvedValue(true),
    };

    service = new ComplaintsService(mockPrisma, mockConfig, mockSms, mockAudit, mockQr);
  });

  it('should submit a complaint and generate sequential ticket id', async () => {
    const dto = {
      hospitalId: 'hosp-1',
      departmentId: 'dept-1',
      categoryId: 'cat-1',
      qrToken: 'valid-token',
      language: 'en' as const,
      patientName: 'Aman',
      mobile: '9876543210',
      patientType: PatientType.OPD,
      description: 'Wheelchair was broken at entrance',
      priority: ComplaintPriority.NORMAL,
    };

    const res = await service.submitComplaint(dto);
    expect(res.success).toBe(true);
    expect(res.ticketId).toBe('FB-2026-000011');
    expect(res.status).toBe(ComplaintStatus.OPEN);
    expect(mockSms.sendComplaintAcknowledgement).toHaveBeenCalledWith(
      '9876543210',
      'FB-2026-000011',
      'Emergency Ward',
    );
  });

  it('should track complaint by ticketId and mobile number', async () => {
    mockPrisma.complaintTicket.findFirst.mockResolvedValue({
      ticketId: 'FB-2026-000011',
      mobile: '9876543210',
      status: ComplaintStatus.IN_PROGRESS,
      priority: ComplaintPriority.NORMAL,
      department: { name: 'Emergency Ward' },
      category: { nameEn: 'Emergency Care' },
      description: 'Wheelchair was broken',
      createdAt: new Date(),
      histories: [],
    });

    const res = await service.trackComplaint('FB-2026-000011', '9876543210');
    expect(res.ticketId).toBe('FB-2026-000011');
    expect(res.status).toBe(ComplaintStatus.IN_PROGRESS);
    expect(res.department).toBe('Emergency Ward');
  });

  it('should throw NotFoundException if tracking ticket does not match', async () => {
    mockPrisma.complaintTicket.findFirst.mockResolvedValue(null);

    await expect(service.trackComplaint('FB-2026-999999', '9876543210')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update complaint status and notify patient with remarks', async () => {
    mockPrisma.complaintTicket.findUnique.mockResolvedValue({
      id: 'comp-uuid-1',
      ticketId: 'FB-2026-000011',
      mobile: '9876543210',
      status: ComplaintStatus.OPEN,
    });

    const res = await service.updateComplaintStatus(
      'comp-uuid-1',
      { status: ComplaintStatus.RESOLVED, remarks: 'Replaced wheelchair with new one' },
      'user-admin-1',
    );

    expect(res.success).toBe(true);
    expect(mockSms.sendComplaintStatusUpdate).toHaveBeenCalledWith(
      '9876543210',
      'FB-2026-000011',
      ComplaintStatus.RESOLVED,
      'Replaced wheelchair with new one',
    );
  });
});
