import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { healthRouter } from './routes/health';
import authRouter from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

export function createServer(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  };
  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req, _res, next) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/auth', authRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
