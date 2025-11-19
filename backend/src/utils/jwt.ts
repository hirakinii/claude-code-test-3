import jwt from 'jsonwebtoken';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
 * @param token - デコードするトークン
 * @returns デコードされたペイロード、またはnull
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    logger.warn('JWT token decoding failed', { error });
    return null;
  }
}
