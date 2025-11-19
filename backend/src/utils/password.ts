import bcrypt from 'bcrypt';
import { logger } from './logger';

const SALT_ROUNDS = 12;

/**
 * パスワードをハッシュ化する
 * @param password - ハッシュ化するプレーンテキストのパスワード
 * @returns ハッシュ化されたパスワード
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    logger.debug('Password hashed successfully');
    return hash;
  } catch (error) {
    logger.error('Failed to hash password', { error });
    throw error;
  }
}

/**
 * パスワードを検証する
 * @param password - 検証するプレーンテキストのパスワード
 * @param hash - 比較対象のハッシュ値
 * @returns パスワードが一致する場合true、それ以外false
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    logger.debug('Password comparison completed', { isMatch });
    return isMatch;
  } catch (error) {
    logger.error('Failed to compare password', { error });
    throw error;
  }
}
