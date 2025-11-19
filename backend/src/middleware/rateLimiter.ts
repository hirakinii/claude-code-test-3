import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * 一般的なAPIエンドポイント用のレート制限
 * 本番環境: 15分あたり100リクエストまで
 * テスト環境: 1秒あたり1000リクエスト（緩い制限で動作確認のみ）
 */
export const generalLimiter = rateLimit({
  windowMs:
    process.env.NODE_ENV === 'test' ? 1000 : config.rateLimitWindowMs,
  max:
    process.env.NODE_ENV === 'test' ? 1000 : config.rateLimitMaxRequests,
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
 * 本番環境: 15分あたり5リクエストまで
 * テスト環境: 1秒あたり100リクエスト（緩い制限で動作確認のみ）
 */
export const authLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 1000 : 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // スキップ条件: ヘルスチェックエンドポイント
  skip: (req) => req.path.startsWith('/health'),
});
