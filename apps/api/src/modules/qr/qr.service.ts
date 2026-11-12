import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
const PDFDocument = require('pdfkit');
import { PrismaService } from '../../common/services/prisma.service';
import { AuditService } from '../audit/audit.service';
import { createQrSignature, verifyQrSignature } from '@esushrut/shared';

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private getSecret(): string {
    return (
      this.configService.get<string>('QR_HMAC_SECRET') ||
      'esushrut-cdac-secure-hmac-sha256-key-salt'
    );
  }

  private getFrontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async generateQr(
    hospitalId: string,
    departmentId: string,
    locationId?: string,
    counterName?: string,
    userId?: string,
  ) {
    const [hospital, department] = await Promise.all([
      this.prisma.hospital.findUnique({ where: { id: hospitalId } }),
      this.prisma.department.findUnique({ where: { id: departmentId } }),
    ]);

    if (!hospital || !department) {
      throw new BadRequestException('Invalid hospital or department ID');
    }

    let location = null;
    if (locationId) {
      location = await this.prisma.qrLocation.findUnique({ where: { id: locationId } });
      if (!location) {
        throw new BadRequestException('Invalid location ID');
      }
    }

    const secret = this.getSecret();
    const token = createQrSignature(hospitalId, departmentId, locationId, secret);

    const baseUrl = this.getFrontendUrl();
    const targetUrl = `${baseUrl}/feedback?h=${hospitalId}&d=${departmentId}${
      locationId ? `&loc=${locationId}` : ''
    }&t=${token}`;

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#1565C0',
        light: '#FFFFFF',
      },
    });

    const code = `QR-${department.code}-${location ? location.name.replace(/\s+/g, '') : 'MAIN'}-${Date.now().toString().slice(-4)}`;

    const qrMaster = await this.prisma.qrMaster.create({
      data: {
        hospitalId,
        departmentId,
        locationId: locationId || null,
        code,
        token,
        targetUrl,
        createdBy: userId || 'SYSTEM',
      },
      include: {
        hospital: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        location: true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'GENERATE_QR',
      entityName: 'QrMaster',
      entityId: qrMaster.id,
      details: { code, targetUrl, department: department.name },
    });

    return {
      ...qrMaster,
      qrDataUrl,
    };
  }

  async verifyToken(
    hospitalId: string,
    departmentId: string,
    locationId: string | undefined,
    token: string,
  ): Promise<boolean> {
    const secret = this.getSecret();
    return verifyQrSignature(hospitalId, departmentId, locationId, token, secret);
  }

  async listQrs(hospitalId?: string, departmentId?: string) {
    const list = await this.prisma.qrMaster.findMany({
      where: {
        ...(hospitalId ? { hospitalId } : {}),
        ...(departmentId ? { departmentId } : {}),
        isActive: true,
      },
      include: {
        hospital: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        location: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach data URLs for direct preview
    return Promise.all(
      list.map(async (qr) => ({
        ...qr,
        qrDataUrl: await QRCode.toDataURL(qr.targetUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 250,
          color: { dark: '#1565C0', light: '#FFFFFF' },
        }),
      })),
    );
  }

  async generateBulkPdf(
    hospitalId: string,
    departmentIds: string[],
    includeTelugu = true,
    includeHindi = true,
  ): Promise<Buffer> {
    const hospital = await this.prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) {
      throw new BadRequestException('Hospital not found');
    }

    const departments = await this.prisma.department.findMany({
      where: {
        hospitalId,
        id: { in: departmentIds },
        isActive: true,
      },
      include: {
        locations: { where: { isActive: true } },
      },
    });

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `DHH KATAKA - QR Standees - ${hospital.name}`,
            Author: 'District Head Hospital, Cuttack (DHH KATAKA)',
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        for (let i = 0; i < departments.length; i++) {
          const dept = departments[i];
          if (i > 0) {
            doc.addPage();
          }

          const secret = this.getSecret();
          const token = createQrSignature(hospitalId, dept.id, undefined, secret);
          const targetUrl = `${this.getFrontendUrl()}/feedback?h=${hospitalId}&d=${dept.id}&t=${token}`;
          const qrBuffer = await QRCode.toBuffer(targetUrl, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 320,
            color: { dark: '#1565C0', light: '#FFFFFF' },
          });

          // Outer Border
          doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).strokeColor('#1565C0').stroke();
          doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).lineWidth(1).strokeColor('#C6E85A').stroke();

          // Header Box
          doc.rect(28, 28, doc.page.width - 56, 90).fillColor('#1565C0').fill();

          doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold');
          doc.text('DHH KATAKA', 40, 42, { align: 'center' });

          doc.fontSize(12).font('Helvetica');
          doc.text('District Head Hospital (Cuttack)', 40, 70, { align: 'center' });

          doc.fontSize(10).fillColor('#FFE9A8');
          doc.text('Patient Care Quality & Grievance Redressal System', 40, 88, { align: 'center' });

          // Hospital Name Banner
          doc.moveDown(3);
          doc.fillColor('#1565C0').fontSize(18).font('Helvetica-Bold');
          doc.text(hospital.name.toUpperCase(), 40, 135, { align: 'center' });

          doc.fontSize(14).fillColor('#333333').font('Helvetica-Bold');
          doc.text(`Department: ${dept.name}`, 40, 165, { align: 'center' });

          // QR Code in Centre
          const qrX = (doc.page.width - 240) / 2;
          doc.image(qrBuffer, qrX, 205, { width: 240, height: 240 });

          // Scan Instruction Callouts
          const instructionY = 470;
          doc.rect(50, instructionY, doc.page.width - 100, 130).fillColor('#F4F7FB').fill();
          doc.rect(50, instructionY, doc.page.width - 100, 130).lineWidth(1).strokeColor('#DDE3EA').stroke();

          doc.fillColor('#1565C0').fontSize(14).font('Helvetica-Bold');
          doc.text('SCAN TO SHARE YOUR FEEDBACK OR REGISTER COMPLAINT', 60, instructionY + 15, {
            align: 'center',
          });

          if (includeTelugu) {
            doc.fontSize(11).fillColor('#B74700').font('Helvetica');
            doc.text('మీ అమూల్యమైన అభిప్రాయాన్ని లేదా ఫిర్యాదును నమోదు చేయడానికి స్కాన్ చేయండి', 60, instructionY + 45, {
              align: 'center',
            });
          }

          if (includeHindi) {
            doc.fontSize(11).fillColor('#333333').font('Helvetica');
            doc.text('अपनी बहुमूल्य प्रतिक्रिया या शिकायत दर्ज करने के लिए स्कैन करें', 60, instructionY + 70, {
              align: 'center',
            });
          }

          doc.fontSize(9).fillColor('#666666').font('Helvetica');
          doc.text('Open Camera or any QR Scanner App on your mobile phone to scan', 60, instructionY + 100, {
            align: 'center',
          });

          // Footer
          doc.rect(28, doc.page.height - 70, doc.page.width - 56, 42).fillColor('#1E6FD9').fill();
          doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
          doc.text('DHH KATAKA - District Head Hospital - Patient Safety & Care Quality Monitoring System', 40, doc.page.height - 54, {
            align: 'center',
          });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
