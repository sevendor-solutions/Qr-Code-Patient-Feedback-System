import { z } from 'zod';
import {
  ComplaintPriority,
  ComplaintStatus,
  PatientType,
  RatingCategory,
  UserRole,
} from '../types';

export const MobileRegex = /^[6-9]\d{9}$/;

export const RatingItemSchema = z.object({
  category: z.nativeEnum(RatingCategory),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
});

export const SubmitFeedbackSchema = z.object({
  hospitalId: z.string().uuid('Invalid hospital ID').optional(),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  locationId: z.string().uuid('Invalid location ID').optional(),
  qrToken: z.string().min(8, 'QR validation token is required').optional(),
  language: z.enum(['en', 'te', 'hi', 'or']).default('or'),
  patientName: z.string().max(100).optional(),
  mobile: z.string().regex(MobileRegex, 'Mobile must be a valid 10-digit Indian number').optional(),
  crNumber: z.string().max(50).optional(),
  patientType: z.nativeEnum(PatientType).optional().default(PatientType.OPD),
  ratings: z.array(RatingItemSchema).optional().default([]),
  overallEmoji: z.number().int().min(1).max(5).optional(),
  npsScore: z.number().int().min(0, 'NPS must be at least 0').max(10, 'NPS cannot exceed 10').optional(),
  comments: z.string().max(2000).optional(),
  service: z.string().optional(),
  hospital: z.string().optional(),
  date: z.string().optional(),
  patient: z.string().optional(),
  ticket: z.string().optional(),
  ward: z.string().optional(),
  answers: z.array(z.number().int().min(1).max(5)).optional(),
  submittedAt: z.string().optional(),
});

export const SubmitComplaintSchema = z.object({
  hospitalId: z.string().uuid('Invalid hospital ID'),
  departmentId: z.string().uuid('Invalid department ID'),
  locationId: z.string().uuid('Invalid location ID').optional(),
  qrToken: z.string().min(8, 'QR validation token is required'),
  language: z.enum(['en', 'te', 'hi']).default('en'),
  patientName: z.string().max(100).optional(),
  mobile: z.string().regex(MobileRegex, 'Mobile must be a valid 10-digit Indian number'),
  crNumber: z.string().max(50).optional(),
  patientType: z.nativeEnum(PatientType),
  categoryId: z.string().uuid('Invalid service category ID'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  priority: z.nativeEnum(ComplaintPriority).default(ComplaintPriority.NORMAL),
});

export const LoginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const GenerateQrSchema = z.object({
  hospitalId: z.string().uuid('Invalid hospital ID'),
  departmentId: z.string().uuid('Invalid department ID'),
  locationId: z.string().uuid('Invalid location ID').optional(),
  counterName: z.string().max(100).optional(),
});

export const BulkQrPrintSchema = z.object({
  hospitalId: z.string().uuid('Invalid hospital ID'),
  departmentIds: z.array(z.string().uuid()).min(1, 'Select at least one department'),
  includeOdia: z.boolean().default(true),
  includeEnglish: z.boolean().default(true),
  includeTelugu: z.boolean().default(false),
  includeHindi: z.boolean().default(false),
});

export const UpdateComplaintStatusSchema = z.object({
  status: z.nativeEnum(ComplaintStatus),
  assignedToId: z.string().uuid().optional(),
  remarks: z.string().min(3, 'Remarks must be at least 3 characters').max(1000),
});

export const TrackComplaintSchema = z.object({
  ticketId: z.string().regex(/^FB-\d{4}-\d{6}$/, 'Ticket ID must match format FB-YYYY-NNNNNN'),
  mobile: z.string().regex(MobileRegex, 'Mobile must be a valid 10-digit number'),
});

export const CreateQuestionSchema = z.object({
  category: z.nativeEnum(RatingCategory),
  questionEn: z.string().min(3),
  questionTe: z.string().min(3),
  questionHi: z.string().min(3),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const CreateCategorySchema = z.object({
  code: z.string().min(2).max(50),
  nameEn: z.string().min(2),
  nameTe: z.string().min(2),
  nameHi: z.string().min(2),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const CreateLocationSchema = z.object({
  hospitalId: z.string().uuid(),
  departmentId: z.string().uuid(),
  name: z.string().min(2),
  floor: z.string().optional(),
  ward: z.string().optional(),
  counter: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const CreateEscalationMatrixSchema = z.object({
  departmentId: z.string().uuid(),
  level: z.number().int().min(1).max(5),
  slaHours: z.number().int().min(1).max(720), // 1 hour to 30 days
  escalateToUserId: z.string().uuid(),
  isActive: z.boolean().default(true),
});

export const FeedbackFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  hospitalId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  maxRating: z.coerce.number().min(1).max(5).optional(),
  search: z.string().optional(),
});

export const ComplaintFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  hospitalId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.nativeEnum(ComplaintStatus).optional(),
  priority: z.nativeEnum(ComplaintPriority).optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
