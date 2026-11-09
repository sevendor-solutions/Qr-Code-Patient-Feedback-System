import { describe, it, expect } from 'vitest';
import { SubmitFeedbackSchema, SubmitComplaintSchema } from '@esushrut/shared';

describe('Frontend Form Validation with Shared Zod Schemas', () => {
  it('fails validation when mobile is less than 10 digits', () => {
    const invalidData = {
      hospitalId: '960cc5db-728e-4bf8-840f-cb2c17431772',
      departmentId: 'd86c7104-a55e-4007-85b4-d55ad5fb3ba6',
      qrToken: 'valid-token-12345',
      language: 'en',
      mobile: '98123', // only 5 digits
      patientType: 'OPD',
      ratings: [{ category: 'REGISTRATION', rating: 4 }],
      overallEmoji: 4,
      npsScore: 8,
    };

    const res = SubmitFeedbackSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0].message).toBe(
        'Mobile must be a valid 10-digit Indian number',
      );
    }
  });

  it('fails validation when rating is out of 1-5 range', () => {
    const invalidRatingData = {
      hospitalId: '960cc5db-728e-4bf8-840f-cb2c17431772',
      departmentId: 'd86c7104-a55e-4007-85b4-d55ad5fb3ba6',
      qrToken: 'valid-token-12345',
      language: 'en',
      mobile: '9876543210',
      patientType: 'OPD',
      ratings: [{ category: 'REGISTRATION', rating: 6 }], // Out of bounds
      overallEmoji: 4,
      npsScore: 8,
    };

    const res = SubmitFeedbackSchema.safeParse(invalidRatingData);
    expect(res.success).toBe(false);
  });

  it('passes validation when valid patient data is provided', () => {
    const validData = {
      hospitalId: '960cc5db-728e-4bf8-840f-cb2c17431772',
      departmentId: 'd86c7104-a55e-4007-85b4-d55ad5fb3ba6',
      qrToken: 'valid-token-12345',
      language: 'en',
      patientName: 'Sunita Devi',
      mobile: '9876543210',
      patientType: 'OPD',
      ratings: [{ category: 'REGISTRATION', rating: 5 }],
      overallEmoji: 5,
      npsScore: 10,
      comments: 'Very satisfied with hospital doctor service',
    };

    const res = SubmitFeedbackSchema.safeParse(validData);
    expect(res.success).toBe(true);
  });
});
