import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * 認証ミドルウェア
 * Authorizationヘッダーからトークンを取得し、検証する
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    // Authorization ヘッダーからトークンを取得
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is missing',
        },
      });
      return;
    }

    // "Bearer <token>" 形式を想定
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authorization header format',
        },
      });
      return;
    }

    const token = parts[1];

    // トークンを検証
    const decoded = verifyToken(token);

    // リクエストオブジェクトにユーザー情報を追加
    req.user = decoded;

    logger.debug('User authenticated', { userId: decoded.userId });
    next();
  } catch (error) {
    logger.warn('Authentication failed', { error });
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}
