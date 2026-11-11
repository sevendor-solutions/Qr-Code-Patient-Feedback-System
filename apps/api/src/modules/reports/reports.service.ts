import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
const PDFDocument = require('pdfkit');
import { PrismaService } from '../../common/services/prisma.service';
import {
  calculateNps,
  maskMobile,
  RatingCategory,
  ComplaintStatus,
} from '@esushrut/shared';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReportsSummary(filters: {
    hospitalId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const whereFeedback: any = {};
    const whereComplaint: any = {};

    if (filters.hospitalId) {
      whereFeedback.hospitalId = filters.hospitalId;
      whereComplaint.hospitalId = filters.hospitalId;
    }
    if (filters.departmentId) {
      whereFeedback.departmentId = filters.departmentId;
      whereComplaint.departmentId = filters.departmentId;
    }

    if (filters.startDate || filters.endDate) {
      whereFeedback.createdAt = {};
      whereComplaint.createdAt = {};
      if (filters.startDate) {
        whereFeedback.createdAt.gte = new Date(filters.startDate);
        whereComplaint.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereFeedback.createdAt.lte = new Date(filters.endDate);
        whereComplaint.createdAt.lte = new Date(filters.endDate);
      }
    }

    const [
      allFeedbacks,
      allComplaints,
      allRatings,
      departments,
    ] = await Promise.all([
      this.prisma.feedback.findMany({
        where: whereFeedback,
        include: {
          department: { select: { id: true, name: true, code: true } },
          ratings: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.complaintTicket.findMany({
        where: whereComplaint,
        include: {
          department: { select: { id: true, name: true } },
          category: { select: { id: true, nameEn: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feedbackRating.findMany({
        where: {
          feedback: whereFeedback,
        },
      }),
      this.prisma.department.findMany({
        where: {
          isActive: true,
          ...(filters.hospitalId ? { hospitalId: filters.hospitalId } : {}),
        },
      }),
    ]);

    // 1. NPS Calculation
    const npsScores = allFeedbacks.map((f) => f.npsScore);
    const npsSummary = calculateNps(npsScores);

    // 2. Overall Rating
    const totalFeedbacks = allFeedbacks.length;
    const avgOverallRating =
      totalFeedbacks > 0
        ? Math.round((allFeedbacks.reduce((acc, f) => acc + f.overallEmoji, 0) / totalFeedbacks) * 10) / 10
        : 0;

    // 3. Department Wise Feedback & Ratings
    const deptMap: Record<string, { id: string; name: string; feedbackCount: number; ratingSum: number; complaintCount: number }> = {};
    for (const d of departments) {
      deptMap[d.id] = { id: d.id, name: d.name, feedbackCount: 0, ratingSum: 0, complaintCount: 0 };
    }

    for (const fb of allFeedbacks) {
      if (deptMap[fb.departmentId]) {
        deptMap[fb.departmentId].feedbackCount++;
        deptMap[fb.departmentId].ratingSum += fb.overallEmoji;
      }
    }

    for (const comp of allComplaints) {
      if (deptMap[comp.departmentId]) {
        deptMap[comp.departmentId].complaintCount++;
      }
    }

    const departmentWise = Object.values(deptMap).map((d) => ({
      departmentId: d.id,
      departmentName: d.name,
      feedbackCount: d.feedbackCount,
      complaintCount: d.complaintCount,
      averageRating: d.feedbackCount > 0 ? Math.round((d.ratingSum / d.feedbackCount) * 10) / 10 : 0,
    }));

    // 4. Service Wise Satisfaction Score (9 master categories)
    const categoryTotals: Record<string, { sum: number; count: number }> = {};
    for (const cat of Object.values(RatingCategory) as string[]) {
      categoryTotals[cat] = { sum: 0, count: 0 };
    }

    for (const r of allRatings) {
      if (categoryTotals[r.category]) {
        categoryTotals[r.category].sum += r.rating;
        categoryTotals[r.category].count++;
      }
    }

    const serviceWiseSatisfaction = Object.entries(categoryTotals).map(([cat, val]) => ({
      category: cat,
      averageRating: val.count > 0 ? Math.round((val.sum / val.count) * 10) / 10 : 0,
      totalResponses: val.count,
    }));

    // 5. Date Wise Rating
    const dateMap: Record<string, { feedbackCount: number; ratingSum: number; npsScores: number[] }> = {};
    for (const fb of allFeedbacks) {
      const dateKey = fb.createdAt.toISOString().slice(0, 10);
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { feedbackCount: 0, ratingSum: 0, npsScores: [] };
      }
      dateMap[dateKey].feedbackCount++;
      dateMap[dateKey].ratingSum += fb.overallEmoji;
      dateMap[dateKey].npsScores.push(fb.npsScore);
    }

    const dateWiseRating = Object.entries(dateMap).map(([date, d]) => ({
      date,
      feedbackCount: d.feedbackCount,
      averageRating: Math.round((d.ratingSum / d.feedbackCount) * 10) / 10,
      npsScore: calculateNps(d.npsScores).npsScore,
    }));

    // 6. Complaint Status Breakdown
    const complaintStatusCounts = {
      [ComplaintStatus.OPEN]: 0,
      [ComplaintStatus.IN_PROGRESS]: 0,
      [ComplaintStatus.RESOLVED]: 0,
      [ComplaintStatus.ESCALATED]: 0,
      [ComplaintStatus.CLOSED]: 0,
    };

    for (const c of allComplaints) {
      if (complaintStatusCounts[c.status] !== undefined) {
        complaintStatusCounts[c.status]++;
      }
    }

    // 7. Low Rating Alerts (<= 2)
    const lowRatingAlerts = allFeedbacks
      .filter((f) => f.overallEmoji <= 2)
      .map((f) => ({
        id: f.id,
        departmentName: f.department.name,
        patientName: f.patientName || 'Anonymous',
        mobile: maskMobile(f.mobile),
        overallEmoji: f.overallEmoji,
        comments: f.comments || 'No comments provided',
        createdAt: f.createdAt,
      }));

    return {
      kpis: {
        totalFeedbacks,
        averageRating: avgOverallRating,
        npsSummary,
        totalComplaints: allComplaints.length,
        resolvedComplaints: complaintStatusCounts[ComplaintStatus.RESOLVED] + complaintStatusCounts[ComplaintStatus.CLOSED],
        escalatedComplaints: complaintStatusCounts[ComplaintStatus.ESCALATED],
        openComplaints: complaintStatusCounts[ComplaintStatus.OPEN] + complaintStatusCounts[ComplaintStatus.IN_PROGRESS],
      },
      departmentWise,
      serviceWiseSatisfaction,
      dateWiseRating,
      complaintStatusCounts,
      lowRatingAlerts,
    };
  }

  async exportExcel(filters: any): Promise<Buffer> {
    const summary = await this.getReportsSummary(filters);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'C-DAC eSushrut G5';
    workbook.created = new Date();

    // Sheet 1: Department Summary
    const ws1 = workbook.addWorksheet('Department Summary');
    ws1.columns = [
      { header: 'Department', key: 'name', width: 35 },
      { header: 'Feedback Count', key: 'feedbackCount', width: 18 },
      { header: 'Average Rating (1-5)', key: 'averageRating', width: 22 },
      { header: 'Complaints', key: 'complaintCount', width: 16 },
    ];
    // Style Header
    ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
    for (const d of summary.departmentWise) {
      ws1.addRow({
        name: d.departmentName,
        feedbackCount: d.feedbackCount,
        averageRating: d.averageRating,
        complaintCount: d.complaintCount,
      });
    }

    // Sheet 2: Service Satisfaction
    const ws2 = workbook.addWorksheet('Service Satisfaction');
    ws2.columns = [
      { header: 'Service Category', key: 'category', width: 25 },
      { header: 'Average Rating (1-5)', key: 'avgRating', width: 22 },
      { header: 'Total Ratings', key: 'count', width: 18 },
    ];
    ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
    for (const s of summary.serviceWiseSatisfaction) {
      ws2.addRow({
        category: s.category,
        avgRating: s.averageRating,
        count: s.totalResponses,
      });
    }

    // Sheet 3: Low Rating Alerts
    const ws3 = workbook.addWorksheet('Low Rating Alerts');
    ws3.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Department', key: 'dept', width: 30 },
      { header: 'Patient Name', key: 'patient', width: 25 },
      { header: 'Mobile (Masked)', key: 'mobile', width: 18 },
      { header: 'Rating', key: 'rating', width: 12 },
      { header: 'Comments', key: 'comments', width: 45 },
    ];
    ws3.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC62828' } };
    for (const alert of summary.lowRatingAlerts) {
      ws3.addRow({
        date: new Date(alert.createdAt).toLocaleString(),
        dept: alert.departmentName,
        patient: alert.patientName,
        mobile: alert.mobile,
        rating: alert.overallEmoji,
        comments: alert.comments,
      });
    }

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  async exportPdf(filters: any): Promise<Buffer> {
    const summary = await this.getReportsSummary(filters);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 36 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.rect(20, 20, doc.page.width - 40, 60).fillColor('#1565C0').fill();
        doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold');
        doc.text('eSushrut G5 - Executive Feedback & SLA Quality Audit Report', 30, 32, {
          align: 'center',
        });
        doc.fontSize(10).font('Helvetica').fillColor('#C6E85A');
        doc.text('Centre for Development of Advanced Computing (C-DAC)', 30, 56, {
          align: 'center',
        });

        doc.moveDown(3);
        doc.fillColor('#333333').fontSize(11).font('Helvetica');
        doc.text(`Generated On: ${new Date().toLocaleString()} | Filter: All Active Records`, 36, 95);

        // KPI Box
        doc.rect(36, 120, doc.page.width - 72, 80).fillColor('#EEF2F7').fill();
        doc.rect(36, 120, doc.page.width - 72, 80).strokeColor('#DDE3EA').stroke();

        doc.fillColor('#1565C0').fontSize(12).font('Helvetica-Bold');
        doc.text('SYSTEM KPI OVERVIEW', 48, 130);

        doc.fontSize(10).font('Helvetica').fillColor('#333333');
        doc.text(`Total Feedbacks: ${summary.kpis.totalFeedbacks}`, 48, 150);
        doc.text(`Average Patient Rating: ${summary.kpis.averageRating} / 5.0`, 48, 170);

        doc.text(`NPS Score: ${summary.kpis.npsSummary.npsScore} (Promoters: ${summary.kpis.npsSummary.promoters}, Detractors: ${summary.kpis.npsSummary.detractors})`, 260, 150);
        doc.text(`Total Complaints: ${summary.kpis.totalComplaints} (Resolved: ${summary.kpis.resolvedComplaints}, Escalated: ${summary.kpis.escalatedComplaints})`, 260, 170);

        // Department Summary Table
        doc.moveDown(4);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0');
        doc.text('DEPARTMENT WISE SATISFACTION & COMPLAINTS', 36, 220);

        let y = 245;
        doc.rect(36, y, doc.page.width - 72, 22).fillColor('#1E6FD9').fill();
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
        doc.text('DEPARTMENT', 42, y + 6);
        doc.text('FEEDBACKS', 280, y + 6);
        doc.text('AVG RATING', 370, y + 6);
        doc.text('COMPLAINTS', 460, y + 6);

        y += 24;
        for (const d of summary.departmentWise) {
          doc.rect(36, y, doc.page.width - 72, 20).fillColor(y % 40 === 0 ? '#F9FBFE' : '#FFFFFF').fill();
          doc.rect(36, y, doc.page.width - 72, 20).strokeColor('#E0E0E0').stroke();

          doc.fillColor('#333333').fontSize(9).font('Helvetica');
          doc.text(d.departmentName.slice(0, 36), 42, y + 5);
          doc.text(d.feedbackCount.toString(), 290, y + 5);
          doc.text(`${d.averageRating} / 5`, 380, y + 5);
          doc.text(d.complaintCount.toString(), 470, y + 5);
          y += 20;
        }

        // Service Satisfaction Section
        y += 25;
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1565C0');
        doc.text('SERVICE WISE SATISFACTION (1 to 5 STARS)', 36, y);

        y += 25;
        for (const s of summary.serviceWiseSatisfaction) {
          doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold');
          doc.text(`${s.category}:`, 42, y);
          doc.font('Helvetica').text(`${s.averageRating} / 5 (${s.totalResponses} responses)`, 200, y);
          y += 16;
        }

        // Footer
        doc.rect(20, doc.page.height - 45, doc.page.width - 40, 25).fillColor('#1565C0').fill();
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica');
        doc.text(
          '© Centre for Development of Advanced Computing (C-DAC) - Confidential Government Hospital Report',
          30,
          doc.page.height - 35,
          { align: 'center' },
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
