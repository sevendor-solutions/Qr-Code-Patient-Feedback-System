import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateQuestionSchema } from '@esushrut/shared';
import { z } from 'zod';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = true) {
    return this.prisma.question.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { displayOrder: 'asc' },
    });
  }

  async create(data: z.infer<typeof CreateQuestionSchema>, userId?: string) {
    return this.prisma.question.create({
      data: {
        category: data.category as any,
        questionEn: data.questionEn,
        questionTe: data.questionTe,
        questionHi: data.questionHi,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        createdBy: userId || 'SYSTEM',
      },
    });
  }

  async update(id: string, data: Partial<z.infer<typeof CreateQuestionSchema>>) {
    const existing = await this.prisma.question.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        ...(data.category ? { category: data.category as any } : {}),
        ...(data.questionEn ? { questionEn: data.questionEn } : {}),
        ...(data.questionTe ? { questionTe: data.questionTe } : {}),
        ...(data.questionHi ? { questionHi: data.questionHi } : {}),
        ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }
}
