import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
        errors = (res as any).errors || null;
      } else {
        message = res as string;
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      errors = exception.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
    } else if ((exception as any)?.code) {
      // Prisma error code handling
      const prismaCode = (exception as any).code;
      if (prismaCode === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'A record with this unique value already exists.';
        errors = (exception as any).meta;
      } else if (prismaCode === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found.';
      } else {
        message = (exception as any).message || 'Database error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      errors,
    });
  }
}
