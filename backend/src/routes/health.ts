/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export const healthRouter = Router();

/**
 * GET /health
 * アプリケーション状態のヘルスチェック
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

/**
 * GET /health/db
 * データベース接続のヘルスチェック
 */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
healthRouter.get('/db', async (_req: Request, res: Response) => {
  try {
    // データベース接続確認
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Database health check failed', { error });

    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      },
    });
  }
});
