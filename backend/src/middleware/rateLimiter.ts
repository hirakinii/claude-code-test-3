import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * 一般的なAPIエンドポイント用のレート制限
 * 15分あたり100リクエストまで
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 認証エンドポイント用の厳格なレート制限
 * 15分あたり5リクエストまで
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 15分あたり5リクエストまで
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // スキップ条件: ヘルスチェックエンドポイントはスキップ
  skip: (req) => req.path.startsWith('/health'),
});
