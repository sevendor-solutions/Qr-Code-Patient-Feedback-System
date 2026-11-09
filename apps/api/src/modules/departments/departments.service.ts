import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(hospitalId?: string) {
    return this.prisma.department.findMany({
      where: {
        isActive: true,
        ...(hospitalId ? { hospitalId } : {}),
      },
      include: {
        hospital: { select: { id: true, name: true, code: true } },
        locations: { where: { isActive: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        hospital: true,
        locations: { where: { isActive: true } },
        escalationMatrices: {
          where: { isActive: true },
          include: { escalateToUser: { select: { id: true, fullName: true, email: true, mobile: true } } },
          orderBy: { level: 'asc' },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }
}
