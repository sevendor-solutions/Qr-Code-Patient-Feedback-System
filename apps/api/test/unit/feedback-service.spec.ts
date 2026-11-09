import { FeedbackService } from '../../src/modules/feedback/feedback.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { PatientType, RatingCategory } from '@esushrut/shared';

describe('FeedbackService (Unit)', () => {
  let service: FeedbackService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockSms: any;
  let mockAudit: any;
  let mockQr: any;

  beforeEach(() => {
    mockPrisma = {
      feedback: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      department: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'dept-1',
          name: 'General OPD',
          headEmail: 'head@hospital.gov.in',
          headPhone: '9811223344',
        }),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback({
          feedback: {
            create: jest.fn().mockResolvedValue({
              id: 'fb-uuid-1',
              mobile: '9876543210',
              patientName: 'Test Patient',
              overallEmoji: 5,
              npsScore: 10,
              ratings: [],
            }),
          },
          qrMaster: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        });
      }),
    };

    mockConfig = {
      get: jest.fn().mockReturnValue(3),
    };

    mockSms = {
      sendFeedbackAcknowledgement: jest.fn().mockResolvedValue(true),
      sendLowRatingAlert: jest.fn().mockResolvedValue(true),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(true),
    };

    mockQr = {
      verifyToken: jest.fn().mockResolvedValue(true),
    };

    service = new FeedbackService(mockPrisma, mockConfig, mockSms, mockAudit, mockQr);
  });

  it('should submit feedback successfully when token is valid and under limit', async () => {
    const dto = {
      hospitalId: 'hosp-1',
      departmentId: 'dept-1',
      qrToken: 'valid-token',
      language: 'en' as const,
      patientName: 'Kishore',
      mobile: '9876543210',
      patientType: PatientType.OPD,
      ratings: [{ category: RatingCategory.DOCTOR, rating: 5 }],
      overallEmoji: 5,
      npsScore: 10,
      comments: 'Great service',
    };

    const res = await service.submitFeedback(dto);
    expect(res.success).toBe(true);
    expect(res.ticketId).toBeDefined();
    expect(mockSms.sendFeedbackAcknowledgement).toHaveBeenCalledWith(
      '9876543210',
      expect.stringMatching(/^FB-\d{4}-\d{6}$/),
      'General OPD',
    );
  });

  it('should throw ForbiddenException if QR token signature fails', async () => {
    mockQr.verifyToken.mockResolvedValue(false);

    const dto = {
      hospitalId: 'hosp-1',
      departmentId: 'dept-1',
      qrToken: 'fake-tampered-token',
      language: 'en' as const,
      mobile: '9876543210',
      patientType: PatientType.OPD,
      ratings: [{ category: RatingCategory.DOCTOR, rating: 5 }],
      overallEmoji: 5,
      npsScore: 10,
    };

    await expect(service.submitFeedback(dto)).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if mobile has already reached daily limit of 3', async () => {
    mockPrisma.feedback.count.mockResolvedValue(3);

    const dto = {
      hospitalId: 'hosp-1',
      departmentId: 'dept-1',
      qrToken: 'valid-token',
      language: 'en' as const,
      mobile: '9876543210',
      patientType: PatientType.OPD,
      ratings: [{ category: RatingCategory.DOCTOR, rating: 5 }],
      overallEmoji: 5,
      npsScore: 10,
    };

    await expect(service.submitFeedback(dto)).rejects.toThrow(
      'Daily limit exceeded. A mobile number can submit up to 3 feedbacks per day.',
    );
  });

  it('should trigger low rating alert to department head when overall rating is <= 2', async () => {
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        feedback: {
          create: jest.fn().mockResolvedValue({
            id: 'fb-uuid-2',
            mobile: '9876543210',
            overallEmoji: 1,
            npsScore: 2,
            ratings: [],
          }),
        },
        qrMaster: { updateMany: jest.fn() },
      });
    });

    const dto = {
      hospitalId: 'hosp-1',
      departmentId: 'dept-1',
      qrToken: 'valid-token',
      language: 'en' as const,
      mobile: '9876543210',
      patientType: PatientType.OPD,
      ratings: [{ category: RatingCategory.DOCTOR, rating: 1 }],
      overallEmoji: 1,
      npsScore: 1,
      comments: 'Very poor doctor response',
    };

    await service.submitFeedback(dto);
    expect(mockSms.sendLowRatingAlert).toHaveBeenCalledWith(
      'head@hospital.gov.in',
      '9811223344',
      'General OPD',
      1,
      '98XXXXXX10',
    );
  });
});
