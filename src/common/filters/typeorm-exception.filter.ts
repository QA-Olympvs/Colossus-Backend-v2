import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

const postgresErrorMap: Record<string, { status: number; message: string }> = {
  '23503': { status: HttpStatus.BAD_REQUEST, message: 'Foreign key violation' },
  '23505': {
    status: HttpStatus.CONFLICT,
    message: 'Unique constraint violation',
  },
  '23502': { status: HttpStatus.BAD_REQUEST, message: 'Not null violation' },
};

@Catch(QueryFailedError)
export class TypeormExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const pgError = exception.driverError as {
      code?: string;
      message?: string;
      detail?: string;
    };
    const code = pgError.code || 'UNKNOWN';
    const mapping = postgresErrorMap[code];

    if (mapping) {
      response.status(mapping.status).json({
        statusCode: mapping.status,
        message: `${mapping.message}: ${pgError.message || pgError.detail || code}`,
        error: HttpStatus[mapping.status],
        code,
      });
    } else {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: pgError.message || 'Database error',
        error: 'Internal Server Error',
        code,
      });
    }
  }
}
