/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';
import { logger } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
  };
}

/**
 * ログイン処理
 * @param credentials - ログイン認証情報
 * @returns ログイン成功時のトークンとユーザー情報
 * @throws Error 認証失敗時
 */
export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const { email, password } = credentials;

  // ユーザーを検索
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    logger.warn('Login attempt with non-existent email', { email });
    throw new Error('Invalid email or password');
  }

  // パスワードを検証
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    logger.warn('Login attempt with invalid password', {
      userId: user.id,
      email,
    });
    throw new Error('Invalid email or password');
  }

  // ロール情報を取得
  const roles = user.userRoles.map((ur) => ur.role.roleName);

  // JWTトークンを生成
  const token = generateToken({
    userId: user.id,
    email: user.email,
    roles,
  });

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    roles,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
    },
  };
}
