import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateLocationSchema } from '@esushrut/shared';
import { z } from 'zod';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(departmentId?: string) {
    return this.prisma.qrLocation.findMany({
      where: {
        isActive: true,
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: z.infer<typeof CreateLocationSchema>, userId?: string) {
    return this.prisma.qrLocation.create({
      data: {
        hospitalId: data.hospitalId,
        departmentId: data.departmentId,
        name: data.name,
        floor: data.floor,
        ward: data.ward,
        counter: data.counter,
        isActive: data.isActive,
        createdBy: userId || 'SYSTEM',
      },
    });
  }

  async update(id: string, data: Partial<z.infer<typeof CreateLocationSchema>>) {
    const existing = await this.prisma.qrLocation.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return this.prisma.qrLocation.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.floor !== undefined ? { floor: data.floor } : {}),
        ...(data.ward !== undefined ? { ward: data.ward } : {}),
        ...(data.counter !== undefined ? { counter: data.counter } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }
}
