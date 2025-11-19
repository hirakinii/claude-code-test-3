import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
  });

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }

  res.status(500).json(errorResponse);
}
