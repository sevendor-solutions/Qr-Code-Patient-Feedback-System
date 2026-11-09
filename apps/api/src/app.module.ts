import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaService } from './common/services/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { QrModule } from './modules/qr/qr.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { EscalationModule } from './modules/escalation/escalation.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              }
            : undefined,
        level: process.env.LOG_LEVEL || 'info',
      },
    }),
    AuditModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    HospitalsModule,
    DepartmentsModule,
    QrModule,
    FeedbackModule,
    ComplaintsModule,
    QuestionsModule,
    CategoriesModule,
    EscalationModule,
    ReportsModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
