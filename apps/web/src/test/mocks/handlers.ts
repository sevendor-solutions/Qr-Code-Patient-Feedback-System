import { http, HttpResponse } from 'msw';

export const handlers = [
  // QR verification
  http.get('/api/qr/verify', ({ request }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get('t');
    if (token === 'valid-token') {
      return HttpResponse.json({ valid: true });
    }
    return HttpResponse.json({ valid: false });
  }),

  // Department details
  http.get('/api/departments/:id', () => {
    return HttpResponse.json({
      id: 'dept-opd',
      code: 'OPD',
      name: 'Outpatient Department (OPD)',
      headName: 'Dr. Rajesh Sharma',
      hospital: {
        id: 'hosp-1',
        name: 'eSushrut Model Civil Hospital',
      },
    });
  }),

  // Service categories
  http.get('/api/categories', () => {
    return HttpResponse.json([
      { id: 'cat-1', code: 'OPD', nameEn: 'OPD Services', nameTe: 'ఓపీడీ సేవలు', nameHi: 'ओपीडी सेवाएं' },
      { id: 'cat-2', code: 'PHARMACY', nameEn: 'Pharmacy', nameTe: 'ఫార్మసీ', nameHi: 'फार्मेसी' },
    ]);
  }),

  // Feedback submission
  http.post('/api/feedback/submit', async ({ request }) => {
    const body: any = await request.json();
    if (!/^[6-9]\d{9}$/.test(body.mobile)) {
      return HttpResponse.json({ message: 'Validation failed' }, { status: 400 });
    }
    return HttpResponse.json({
      success: true,
      ticketId: 'FB-2026-000099',
      message: 'Feedback submitted successfully',
    });
  }),

  // Complaint submission
  http.post('/api/complaints/submit', () => {
    return HttpResponse.json({
      success: true,
      ticketId: 'FB-2026-000100',
      message: 'Grievance ticket registered',
    });
  }),

  // Reports summary
  http.get('/api/reports/summary', () => {
    return HttpResponse.json({
      kpis: {
        totalFeedbacks: 150,
        averageRating: 4.4,
        npsSummary: { promoters: 100, passives: 30, detractors: 20, npsScore: 53 },
        totalComplaints: 12,
        resolvedComplaints: 10,
        escalatedComplaints: 2,
        openComplaints: 2,
      },
      departmentWise: [],
      serviceWiseSatisfaction: [],
      dateWiseRating: [],
      complaintStatusCounts: { OPEN: 2, IN_PROGRESS: 0, RESOLVED: 10, ESCALATED: 2, CLOSED: 0 },
      lowRatingAlerts: [],
    });
  }),
];
