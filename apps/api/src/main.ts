import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);

  // Security: Helmet headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Allows Swagger UI and local development
    }),
  );

  // Security: CORS Configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Serve static uploaded photos securely
  const uploadsPath = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('eSushrut G5 - Patient Feedback & Query System API')
    .setDescription(
      'Official C-DAC Government Hospital Management System (eSushrut G5) module for QR Code feedback, real-time grievance tracking, and SLA escalation matrix.',
    )
    .setVersion('1.0.0')
    .addTag('Authentication', 'JWT token generation, refresh, and profile endpoints')
    .addTag('QR Management', 'Generation, verification, and bulk PDF printing of QR standees')
    .addTag('Feedback', 'Patient star ratings, NPS score calculation, and feedback listing')
    .addTag('Complaints', 'Complaint registration, photo attachment, and status tracking')
    .addTag('Reports & Analytics', 'Department summary, service metrics, and Excel/PDF export')
    .addTag('Escalation Matrix', 'Configurable multi-tier SLAs and auto-escalation cron triggers')
    .addTag('Questions Master', 'Multilingual question catalog (English, Telugu, Hindi)')
    .addTag('Service Categories', 'Hospital service category masters')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'eSushrut G5 API Documentation | C-DAC',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  pinoLogger.log(`================================================================`);
  pinoLogger.log(` eSushrut G5 Backend API running at: http://localhost:${port}/api`);
  pinoLogger.log(` Swagger API Docs available at:      http://localhost:${port}/api/docs`);
  pinoLogger.log(`================================================================`);
}

bootstrap();
