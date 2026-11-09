import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser, UserRole } from '@esushrut/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    const { passwordHash, refreshTokenHash, ...result } = user;
    return result;
  }

  async login(username: string, pass: string, ipAddress?: string, userAgent?: string) {
    const user = await this.validateUser(username, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      hospitalId: user.hospitalId,
      departmentId: user.departmentId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'esushrut-g5-jwt-access-secret-cdac-key-2026',
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '3600s',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'esushrut-g5-jwt-refresh-secret-cdac-key-2026',
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    });

    const salt = await bcrypt.genSalt(10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
        lastLoginAt: new Date(),
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entityName: 'User',
      entityId: user.id,
      details: { username: user.username, role: user.role },
      ipAddress,
      userAgent,
    });

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      hospitalId: user.hospitalId || undefined,
      departmentId: user.departmentId || undefined,
    };

    return {
      accessToken,
      refreshToken,
      user: authUser,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'esushrut-g5-jwt-refresh-secret-cdac-key-2026';
      const decoded = this.jwtService.verify(refreshToken, { secret: refreshSecret });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive || !user.refreshTokenHash) {
        throw new UnauthorizedException('Access denied or user inactive');
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid or revoked refresh token');
      }

      const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
        hospitalId: user.hospitalId,
        departmentId: user.departmentId,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'esushrut-g5-jwt-access-secret-cdac-key-2026',
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '3600s',
      });

      const newRefreshToken = this.jwtService.sign(payload, {
        secret: refreshSecret,
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
      });

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newRefreshToken, salt);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: newHash },
      });

      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role as UserRole,
        hospitalId: user.hospitalId || undefined,
        departmentId: user.departmentId || undefined,
      };

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: authUser,
      };
    } catch (err: any) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    await this.auditService.log({
      userId,
      action: 'LOGOUT',
      entityName: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });

    return { message: 'Logged out successfully' };
  }
}
