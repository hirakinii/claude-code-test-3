import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { logger } from '../utils/logger';

/**
 * ロールベースアクセス制御ミドルウェア
 * 指定されたロールを持つユーザーのみアクセスを許可する
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // 認証ミドルウェアが先に実行されていることを前提
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      // ユーザーのロールをチェック
      const userRoles = req.user.roles || [];
      const hasRequiredRole = allowedRoles.some((role) =>
        userRoles.includes(role),
      );

      if (!hasRequiredRole) {
        logger.warn('Access denied due to insufficient permissions', {
          userId: req.user.userId,
          userRoles,
          requiredRoles: allowedRoles,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        });
        return;
      }

      logger.debug('Role check passed', {
        userId: req.user.userId,
        userRoles,
      });

      next();
    } catch (error) {
      logger.error('Role check failed', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify user permissions',
        },
      });
    }
  };
}

/**
 * 管理者のみアクセス可能
 */
export const requireAdmin = requireRole('ADMINISTRATOR');

/**
 * 作成者または管理者がアクセス可能
 */
export const requireCreator = requireRole('CREATOR', 'ADMINISTRATOR');
