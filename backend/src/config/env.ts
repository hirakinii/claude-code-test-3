import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // サーバー設定
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // データベース設定
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT設定
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // CORS設定
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // レート制限設定
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分
  rateLimitMaxRequests: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    10,
  ),
} as const;

// 必須環境変数のチェック
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Environment variable ${envVar} is required but not defined`,
    );
  }
}

// 開発環境での警告
if (config.nodeEnv === 'development') {
  if (
    config.jwtSecret === 'dev_jwt_secret_change_this_in_production_12345678'
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️  WARNING: Using default JWT_SECRET in development. Change this in production!',
    );
  }
}
