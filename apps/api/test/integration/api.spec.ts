import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/common/services/prisma.service';
import { createQrSignature } from '@esushrut/shared';
import * as fs from 'fs';
import * as path from 'path';

describe('eSushrut G5 End-to-End API Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let officerToken: string;
  let hospitalId: string;
  let departmentId: string;
  let categoryId: string;
  let validQrToken: string;
  const qrSecret = 'esushrut-cdac-secure-hmac-sha256-key-salt';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();

    prisma = app.get(PrismaService);

    // Fetch seeded hospital, department, category
    const hospital = await prisma.hospital.findFirst({ where: { code: 'ESUSHRUT-CENTRAL' } });
    const dept = await prisma.department.findFirst({ where: { code: 'OPD' } });
    const cat = await prisma.serviceCategory.findFirst({ where: { code: 'OPD' } });

    hospitalId = hospital!.id;
    departmentId = dept!.id;
    categoryId = cat!.id;

    validQrToken = createQrSignature(hospitalId, departmentId, undefined, qrSecret);

    // Login Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin@12345' });
    adminToken = adminLogin.body.accessToken;

    // Login Officer
    const officerLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'officer_nodal', password: 'Officer@12345' });
    officerToken = officerLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication & Roles', () => {
    it('POSITIVE: Admin login returns 200 with JWT accessToken and role SUPER_ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'Admin@12345' })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('SUPER_ADMIN');
    });

    it('NEGATIVE: Invalid credentials return 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'WrongPassword' })
        .expect(401);
    });

    it('NEGATIVE: Expired / invalid JWT returns 401 on protected endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/feedback')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });

    it('NEGATIVE: FEEDBACK_OFFICER cannot create a Question Master item (Forbidden 403)', async () => {
      await request(app.getHttpServer())
        .post('/api/questions')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          category: 'REGISTRATION',
          questionEn: 'How was the reception desk?',
          questionTe: 'రిసెప్షన్ ఎలా ఉంది?',
          questionHi: 'रिसेप्शन कैसा था?',
          displayOrder: 10,
          isActive: true,
        })
        .expect(403);
    });
  });

  describe('QR Token Verification & Generation', () => {
    it('POSITIVE: Valid HMAC token verifies as valid: true', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/qr/verify?h=${hospitalId}&d=${departmentId}&t=${validQrToken}`)
        .expect(200);

      expect(res.body.valid).toBe(true);
    });

    it('NEGATIVE: Tampered QR token verifies as valid: false', async () => {
      const tampered = validQrToken.slice(0, -4) + '0000';
      const res = await request(app.getHttpServer())
        .get(`/api/qr/verify?h=${hospitalId}&d=${departmentId}&t=${tampered}`)
        .expect(200);

      expect(res.body.valid).toBe(false);
    });
  });

  describe('Feedback Submission & Business Rules', () => {
    const testMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    it('POSITIVE: Submit valid feedback returns 201 with Ticket ID', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/feedback/submit')
        .send({
          hospitalId,
          departmentId,
          qrToken: validQrToken,
          language: 'en',
          patientName: 'Integration Tester',
          mobile: testMobile,
          patientType: 'OPD',
          ratings: [
            { category: 'REGISTRATION', rating: 4 },
            { category: 'DOCTOR', rating: 5 },
          ],
          overallEmoji: 4,
          npsScore: 9,
          comments: 'Smooth registration experience',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.ticketId).toMatch(/^FB-\d{4}-\d{6}$/);
    });

    it('NEGATIVE: Submit feedback with invalid mobile number returns 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/feedback/submit')
        .send({
          hospitalId,
          departmentId,
          qrToken: validQrToken,
          language: 'en',
          mobile: '12345', // invalid
          patientType: 'OPD',
          ratings: [{ category: 'REGISTRATION', rating: 4 }],
          overallEmoji: 4,
          npsScore: 9,
        })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('NEGATIVE: Submit feedback with rating out of range (6 stars) returns 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/feedback/submit')
        .send({
          hospitalId,
          departmentId,
          qrToken: validQrToken,
          language: 'en',
          mobile: '9812345678',
          patientType: 'OPD',
          ratings: [{ category: 'REGISTRATION', rating: 6 }], // Out of range!
          overallEmoji: 4,
          npsScore: 9,
        })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('NEGATIVE: Tampered QR token on feedback submission returns 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/api/feedback/submit')
        .send({
          hospitalId,
          departmentId,
          qrToken: 'fake-tampered-token-xyz',
          language: 'en',
          mobile: '9812345679',
          patientType: 'OPD',
          ratings: [{ category: 'REGISTRATION', rating: 4 }],
          overallEmoji: 4,
          npsScore: 9,
        })
        .expect(403);
    });
  });

  describe('Complaints & File Upload Verification', () => {
    it('POSITIVE: Track complaint returns timeline and status for valid ticket + mobile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/complaints/track?ticketId=FB-2026-000001&mobile=9811998877')
        .expect(200);

      expect(res.body.ticketId).toBe('FB-2026-000001');
      expect(res.body.status).toBeDefined();
      expect(Array.isArray(res.body.timeline)).toBe(true);
    });

    it('NEGATIVE: Non-existent ticket or mobile returns 404 Not Found', async () => {
      await request(app.getHttpServer())
        .get('/api/complaints/track?ticketId=FB-2026-999999&mobile=9811998877')
        .expect(404);
    });

    it('NEGATIVE: Uploading fake non-image file disguised as .jpg returns 400 Bad Request', async () => {
      const fakeFilePath = path.join(__dirname, 'temp_fake.jpg');
      fs.writeFileSync(fakeFilePath, 'not a real jpeg content at all');

      try {
        await request(app.getHttpServer())
          .post('/api/complaints/submit')
          .field('hospitalId', hospitalId)
          .field('departmentId', departmentId)
          .field('categoryId', categoryId)
          .field('qrToken', validQrToken)
          .field('mobile', '9819998888')
          .field('patientType', 'OPD')
          .field('description', 'Test complaint with malicious fake image attachment')
          .attach('photo', fakeFilePath)
          .expect(400);
      } finally {
        if (fs.existsSync(fakeFilePath)) {
          fs.unlinkSync(fakeFilePath);
        }
      }
    });
  });

  describe('Reports & Analytics Exports', () => {
    it('POSITIVE: Get reports summary returns calculated KPIs and department breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.kpis).toBeDefined();
      expect(res.body.kpis.npsSummary).toBeDefined();
      expect(Array.isArray(res.body.departmentWise)).toBe(true);
    });

    it('POSITIVE: Export reports to Excel returns .xlsx binary stream', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/export/excel')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.header['content-type']).toContain('spreadsheetml');
    });

    it('POSITIVE: Export reports to PDF returns application/pdf stream', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/export/pdf')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.header['content-type']).toBe('application/pdf');
    });
  });
});
