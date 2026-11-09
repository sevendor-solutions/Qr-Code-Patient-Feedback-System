import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class HospitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.hospital.findMany({
      where: { isActive: true },
      include: {
        departments: {
          where: { isActive: true },
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
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
