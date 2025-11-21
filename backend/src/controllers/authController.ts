import { Request, Response } from 'express';
import { login } from '../services/authService';
import { logger } from '../utils/logger';
import { LoginRequestBody } from '../types/requests';

/**
 * POST /api/auth/login
 * ユーザーログイン
 */
export async function loginHandler(
  req: Request<object, object, LoginRequestBody>,
  res: Response
): Promise<void> {
  try {
    const { email, password } = req.body;

    // バリデーション
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
      return;
    }

    // ログイン処理
    const result = await login({ email, password });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Login failed', { error });

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Invalid email or password',
      },
    });
  }
}
