export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DEPT_HEAD = 'DEPT_HEAD',
  FEEDBACK_OFFICER = 'FEEDBACK_OFFICER',
}

export enum PatientType {
  OPD = 'OPD',
  IPD = 'IPD',
  EMERGENCY = 'EMERGENCY',
  ATTENDANT = 'ATTENDANT',
  VISITOR = 'VISITOR',
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED',
}

export enum ComplaintPriority {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
}

export enum RatingCategory {
  REGISTRATION = 'REGISTRATION',
  WAITING_TIME = 'WAITING_TIME',
  DOCTOR = 'DOCTOR',
  NURSING = 'NURSING',
  CLEANLINESS = 'CLEANLINESS',
  LAB = 'LAB',
  PHARMACY = 'PHARMACY',
  BILLING = 'BILLING',
  STAFF_BEHAVIOUR = 'STAFF_BEHAVIOUR',
}

export type SupportedLanguage = 'en' | 'te' | 'hi';

export interface QrPayload {
  hospitalId: string;
  departmentId: string;
  locationId: string;
  token: string;
}

export interface FeedbackRatingInput {
  category: RatingCategory;
  rating: number; // 1 to 5
}

export interface SubmitFeedbackDto {
  hospitalId: string;
  departmentId: string;
  locationId?: string;
  qrToken: string;
  language: SupportedLanguage;
  patientName?: string;
  mobile: string; // 10 digits
  crNumber?: string;
  patientType: PatientType;
  ratings: FeedbackRatingInput[];
  overallEmoji: number; // 1 to 5
  npsScore: number; // 0 to 10
  comments?: string;
}

export interface SubmitComplaintDto {
  hospitalId: string;
  departmentId: string;
  locationId?: string;
  qrToken: string;
  language: SupportedLanguage;
  patientName?: string;
  mobile: string; // 10 digits
  crNumber?: string;
  patientType: PatientType;
  categoryId: string;
  description: string;
  priority: ComplaintPriority;
}

export interface ComplaintStatusUpdateDto {
  status: ComplaintStatus;
  assignedToId?: string;
  remarks: string;
}

export interface NpsSummary {
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  npsScore: number; // -100 to +100
}

export interface ServiceSatisfactionSummary {
  category: RatingCategory;
  averageRating: number;
  totalResponses: number;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  hospitalId?: string;
  departmentId?: string;
}
