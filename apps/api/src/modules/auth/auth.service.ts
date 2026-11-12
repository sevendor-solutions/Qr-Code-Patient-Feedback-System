import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser, UserRole } from '@esushrut/shared';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    try {
      // 1. Ensure default hospital exists
      let hospital = await this.prisma.hospital.findFirst();
      if (!hospital) {
        hospital = await this.prisma.hospital.create({
          data: {
            code: 'DHH-KATAKA',
            name: 'DHH KATAKA - District Head Hospital',
            address: 'District Headquarters Hospital, Cuttack, Odisha - 753001',
            contactEmail: 'nodal.grievance@dhhkataka.gov.in',
            contactPhone: '0671-2300000',
            logoUrl: '/cdac-logo.svg',
            isActive: true,
            createdBy: 'SYSTEM_INSTALLER',
          },
        });
      } else {
        hospital = await this.prisma.hospital.update({
          where: { id: hospital.id },
          data: {
            name: 'DHH KATAKA - District Head Hospital',
            address: 'District Headquarters Hospital, Cuttack, Odisha - 753001',
          },
        });
      }

      // 2. Ensure OPD and IPD departments exist
      let opdDept = await this.prisma.department.findFirst({
        where: { hospitalId: hospital.id, code: 'OPD' },
      });
      if (!opdDept) {
        opdDept = await this.prisma.department.create({
          data: {
            hospitalId: hospital.id,
            code: 'OPD',
            name: 'Outpatient Department (OPD) · ବହିଃ-ବିଭାଗ',
            headName: 'Dr. Rajesh Sharma',
            headEmail: 'rajesh.sharma@hospital.gov.in',
            headPhone: '9811223344',
            createdBy: 'SYSTEM_INSTALLER',
          },
        });
      }

      let ipdDept = await this.prisma.department.findFirst({
        where: { hospitalId: hospital.id, code: 'IPD' },
      });
      if (!ipdDept) {
        ipdDept = await this.prisma.department.create({
          data: {
            hospitalId: hospital.id,
            code: 'IPD',
            name: 'Inpatient Department (IPD) · ଅନ୍ତଃ-ବିଭାଗ Wards',
            headName: 'Dr. K. S. Rao',
            headEmail: 'ks.rao@hospital.gov.in',
            headPhone: '9833445566',
            createdBy: 'SYSTEM_INSTALLER',
          },
        });
      }

      // 3. Ensure default test users exist and credentials match
      const salt = await bcrypt.genSalt(10);
      const adminPassHash = await bcrypt.hash('Admin@12345', salt);
      const headPassHash = await bcrypt.hash('Head@12345', salt);
      const officerPassHash = await bcrypt.hash('Officer@12345', salt);

      await this.prisma.user.upsert({
        where: { username: 'admin' },
        update: { passwordHash: adminPassHash, isActive: true },
        create: {
          username: 'admin',
          passwordHash: adminPassHash,
          email: 'superadmin@esushrut-cdac.in',
          fullName: 'Dr. B. K. Murthy (Director General)',
          mobile: '9810010010',
          role: UserRole.SUPER_ADMIN,
          hospitalId: hospital.id,
          createdBy: 'SYSTEM_INSTALLER',
        },
      });

      await this.prisma.user.upsert({
        where: { username: 'head_opd' },
        update: { passwordHash: headPassHash, isActive: true },
        create: {
          username: 'head_opd',
          passwordHash: headPassHash,
          email: 'head.opd@hospital.gov.in',
          fullName: 'Dr. Rajesh Sharma (Head - OPD)',
          mobile: '9811223344',
          role: UserRole.DEPT_HEAD,
          hospitalId: hospital.id,
          departmentId: opdDept.id,
          createdBy: 'SYSTEM_INSTALLER',
        },
      });

      await this.prisma.user.upsert({
        where: { username: 'officer_nodal' },
        update: { passwordHash: officerPassHash, isActive: true },
        create: {
          username: 'officer_nodal',
          passwordHash: officerPassHash,
          email: 'nodal.feedback@hospital.gov.in',
          fullName: 'Shri Vikram Rathore (Nodal Grievance Officer)',
          mobile: '9899887766',
          role: UserRole.FEEDBACK_OFFICER,
          hospitalId: hospital.id,
          createdBy: 'SYSTEM_INSTALLER',
        },
      });

      this.logger.log('Default credentials verified and ensured for admin, head_opd, officer_nodal.');
    } catch (err: any) {
      this.logger.warn(`Could not auto-seed users in onModuleInit: ${err.message}`);
    }
  }

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
