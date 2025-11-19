import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * エラーハンドリングミドルウェア
 * カスタムエラークラス（AppError）と一般的なエラーを処理
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // AppError の場合
  if (err instanceof AppError) {
    logger.warn('Application error', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
      path: req.path,
      method: req.method,
    });

    const errorResponse: {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    } = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err.details) {
      errorResponse.error.details = err.details;
    }

    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // その他のエラー
  logger.error('Unhandled error', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack,
      }),
    },
  });
}

/**
 * 404 Not Found ハンドラー
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
