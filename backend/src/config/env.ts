import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

/**
 * 環境変数から設定オブジェクトを生成する
 * @param env - 環境変数オブジェクト（デフォルトは process.env）
 */
export function createConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    // サーバー設定
    port: parseInt(env.PORT || '3001', 10),
    nodeEnv: env.NODE_ENV || 'development',

    // データベース設定
    databaseUrl: env.DATABASE_URL || '',

    // JWT設定
    jwtSecret: env.JWT_SECRET || '',
    jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',

    // CORS設定
    corsOrigin: env.CORS_ORIGIN || 'http://localhost:3000',

    // レート制限設定
    rateLimitWindowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分
    rateLimitMaxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  };
}

/**
 * 必須環境変数が設定されているかチェックする
 * @param env - 環境変数オブジェクト（デフォルトは process.env）
 * @param requiredVars - 必須環境変数の配列
 * @throws 必須環境変数が未定義の場合
 */
export function validateRequiredEnvVars(
  env: NodeJS.ProcessEnv = process.env,
  requiredVars: string[] = ['DATABASE_URL', 'JWT_SECRET'],
): void {
  for (const envVar of requiredVars) {
    if (!env[envVar]) {
      throw new Error(
        `Environment variable ${envVar} is required but not defined`,
      );
    }
  }
}

/**
 * 開発環境でデフォルトのJWT_SECRETを使用している場合に警告を出す
 * @param configObj - 設定オブジェクト
 */
export function warnIfDefaultJwtSecret(configObj: Config): void {
  if (configObj.nodeEnv === 'development') {
    if (
      configObj.jwtSecret ===
      'dev_jwt_secret_change_this_in_production_12345678'
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        '⚠️  WARNING: Using default JWT_SECRET in development. Change this in production!',
      );
    }
  }
}

// 必須環境変数のチェック
validateRequiredEnvVars();

// 設定オブジェクトの生成とエクスポート
export const config = createConfig();

// 開発環境での警告
warnIfDefaultJwtSecret(config);
