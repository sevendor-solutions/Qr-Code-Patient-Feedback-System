import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class HospitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const hospitals = await this.prisma.hospital.findMany({
      where: { isActive: true },
      include: {
        departments: {
          where: { isActive: true },
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return Promise.all(
      hospitals.map(async (h) => {
        let cleanName = (h.name || '').replace(/\s*\([Ee][Ss][Uu][Ss][Hh][Rr][Uu][Tt][^\)]*\)/g, '').trim();
        let cleanCode = (h.code || '').replace(/ESUSHRUT-CENTRAL/i, 'DHH-KATAKA');
        if (/eSushrut Model/i.test(cleanName) || cleanName === '') {
          cleanName = 'DHH KATAKA - District Head Hospital';
        }
        if (cleanName !== h.name || cleanCode !== h.code) {
          try {
            await this.prisma.hospital.update({
              where: { id: h.id },
              data: { name: cleanName, code: cleanCode },
            });
          } catch {
            // ignore if unique constraint or readonly
          }
        }
        return {
          ...h,
          name: cleanName,
          code: cleanCode,
        };
      }),
    );
  }

  async findById(id: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
      include: {
        departments: {
          where: { isActive: true },
        },
        locations: {
          where: { isActive: true },
        },
      },
    });

    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }

    return hospital;
  }
}
