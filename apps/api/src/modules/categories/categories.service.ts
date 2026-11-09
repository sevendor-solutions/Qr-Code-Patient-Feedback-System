import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateCategorySchema } from '@esushrut/shared';
import { z } from 'zod';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = true) {
    return this.prisma.serviceCategory.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { nameEn: 'asc' },
    });
  }

  async create(data: z.infer<typeof CreateCategorySchema>, userId?: string) {
    return this.prisma.serviceCategory.create({
      data: {
        code: data.code,
        nameEn: data.nameEn,
        nameTe: data.nameTe,
        nameHi: data.nameHi,
        description: data.description,
        isActive: data.isActive,
        createdBy: userId || 'SYSTEM',
      },
    });
  }

  async update(id: string, data: Partial<z.infer<typeof CreateCategorySchema>>) {
    const existing = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(data.code ? { code: data.code } : {}),
        ...(data.nameEn ? { nameEn: data.nameEn } : {}),
        ...(data.nameTe ? { nameTe: data.nameTe } : {}),
        ...(data.nameHi ? { nameHi: data.nameHi } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }
}
