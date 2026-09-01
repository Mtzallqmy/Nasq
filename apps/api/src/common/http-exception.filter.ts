import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    let code = `HTTP_${status}`;
    let message = 'حدث خطأ غير متوقع';
    let details: unknown;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const body = exceptionResponse as Record<string, unknown>;
      if (typeof body.code === 'string') code = body.code;
      if (typeof body.message === 'string') message = body.message;
      if (Array.isArray(body.message)) {
        code = 'VALIDATION_ERROR';
        message = 'بيانات الطلب غير صالحة';
        details = body.message;
      }
      if (body.details !== undefined) details = body.details;
    }

    if (status >= 500) {
      console.error(
        JSON.stringify({
          level: 'error',
          event: 'unhandled_exception',
          requestId: request.requestId,
          method: request.method,
          path: request.originalUrl,
          error: exception instanceof Error ? exception.message : String(exception),
        }),
      );
    }

    response.status(status).json({
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
        requestId: request.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
