import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrowException } from './custom-errors';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  private readonly allowedOrigins: string[] = (() => {
    const origins: string[] = [];
    origins.push('http://localhost:3000');
    
    if (process.env.FRONTEND_URL) {
      const frontendUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, '');
      if (frontendUrl) origins.push(frontendUrl);
    }
    
    if (process.env.ALLOWED_ORIGINS) {
      const additionalOrigins = process.env.ALLOWED_ORIGINS
        .split(',')
        .map(origin => origin.trim().replace(/\/$/, ''))
        .filter(origin => origin.length > 0);
      origins.push(...additionalOrigins);
    }
    
    return [...new Set(origins)];
  })();

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let data: any = null;
    let details: any = null;

    // Handle custom ThrowException
    if (exception instanceof ThrowException) {
      status = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode ?? errorCode;
      data = exception.data ?? null;
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        message = res.message || exception.message;
        if (Array.isArray(res.message)) {
          message = res.message.join(', ');
          details = res.message;
        }
        errorCode = res.errorCode || this.getErrorCodeFromStatus(status);
      } else {
        message = exception.message;
      }
    }
    // Handle TypeORM errors
    else if (this.isTypeOrmError(exception)) {
      const typeOrmError = exception as any;
      message = this.extractTypeOrmErrorMessage(typeOrmError);
      errorCode = 'DATABASE_ERROR';
      status = HttpStatus.BAD_REQUEST;
      details = this.extractTypeOrmErrorDetails(typeOrmError);
    }
    else if (exception instanceof Error) {
      message = exception.message || 'An unexpected error occurred';
      errorCode = 'UNHANDLED_ERROR';

      if (process.env.NODE_ENV === 'development') {
        details = {
          name: exception.name,
          stack: exception.stack,
        };
      }
    }
    // Handle unknown errors
    else {
      message = 'An unexpected error occurred';
      errorCode = 'UNKNOWN_ERROR';

      if (process.env.NODE_ENV === 'development') {
        details = {
          type: typeof exception,
          value: String(exception),
        };
      }
    }

    this.logger.error(
      `[${request.method}] ${request.url} → ${message}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    const errorResponse: any = {
      status: status >= 500 ? 'error' : 'failed',
      statusCode: status,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (data !== null) {
      errorResponse.data = data;
    }

    if (process.env.NODE_ENV === 'development' && details) {
      errorResponse.details = details;
    }

    // Add CORS headers to error responses
    const origin = request.headers.origin as string | undefined;
    if (origin && this.allowedOrigins.includes(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Credentials', 'true');
      response.setHeader(
        'Access-Control-Expose-Headers',
        'X-New-Access-Token, Authorization',
      );
    }

    response.status(status).json(errorResponse);
  }

  private isTypeOrmError(exception: any): boolean {
    return (
      exception?.code ||
      exception?.sqlMessage ||
      exception?.sqlState ||
      exception?.query ||
      exception?.driverError
    );
  }

  /**
   * Extract user-friendly message from TypeORM error
   */
  private extractTypeOrmErrorMessage(error: any): string {
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      const match = error.detail || error.message;
      if (match) {
        const fieldMatch = match.match(/Key \(([^)]+)\)/);
        if (fieldMatch) {
          return `${fieldMatch[1]} already exists`;
        }
      }
      return 'Duplicate entry. This record already exists';
    }

    if (error.code === '23503' || error.code === 'ER_NO_REFERENCED_ROW_2') {
      return 'Referenced record does not exist';
    }

    // Not null constraint violation
    if (error.code === '23502' || error.code === 'ER_BAD_NULL_ERROR') {
      const match = error.message?.match(/column "([^"]+)"/);
      if (match) {
        return `${match[1]} is required`;
      }
      return 'Required field is missing';
    }

    if (error.code === '23514') {
      return 'Data validation failed';
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return 'Database connection failed';
    }

    return error.message || 'Database error occurred';
  }

  private extractTypeOrmErrorDetails(error: any): any {
    const details: any = {
      code: error.code,
      sqlState: error.sqlState,
    };

    if (error.query) {
      details.query = error.query;
    }

    if (error.parameters) {
      details.parameters = error.parameters;
    }

    if (error.driverError) {
      details.driverError = error.driverError;
    }

    return details;
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusToCode: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusToCode[status] || 'INTERNAL_SERVER_ERROR';
  }
}
