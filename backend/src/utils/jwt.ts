import jwt from 'jsonwebtoken';
import { logger } from './logger';

/* istanbul ignore next -- @preserve: Environment variable fallbacks only used when env vars are missing */
const JWT_SECRET = process.env.JWT_SECRET || '';
/* istanbul ignore next -- @preserve: Environment variable fallbacks only used when env vars are missing */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/* istanbul ignore if -- @preserve: This check runs at module load time when JWT_SECRET is always set in tests */
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

/**
 * JWTトークンを生成する
 * @param payload - トークンに含めるペイロード
 * @returns 生成されたJWTトークン
 */
export function generateToken(payload: JwtPayload): string {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'spec-manager-api',
    });

    logger.debug('JWT token generated', { userId: payload.userId });
    return token;
  } catch (error) {
    logger.error('Failed to generate JWT token', { error });
    throw error;
  }
}

/**
 * JWTトークンを検証する
 * @param token - 検証するトークン
 * @returns デコードされたペイロード
 * @throws Error トークンが無効または期限切れの場合
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'spec-manager-api',
    }) as JwtPayload;

    logger.debug('JWT token verified', { userId: decoded.userId });
    return decoded;
  } catch (error) {
    logger.warn('JWT token verification failed', { error });
    throw error;
  }
}

/**
 * JWTトークンをデコードする（検証なし）
 * jwt.decode() は例外を投げず、無効なトークンには null を返す
 * @param token - デコードするトークン
 * @returns デコードされたペイロード、またはnull
 */
export function decodeToken(token: string): JwtPayload | null {
  const decoded = jwt.decode(token) as JwtPayload | null;
  if (decoded) {
    logger.debug('JWT token decoded', { userId: decoded.userId });
  }
  return decoded;
}
