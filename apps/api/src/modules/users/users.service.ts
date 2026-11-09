import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@esushrut/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role?: UserRole) {
    return this.prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        mobile: true,
        role: true,
        hospitalId: true,
        departmentId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        mobile: true,
        role: true,
        hospitalId: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
