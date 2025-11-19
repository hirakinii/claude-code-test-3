import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { healthRouter } from './routes/health';
import authRouter from './routes/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import { config } from './config/env';
import { logger } from './utils/logger';

export function createServer(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOptions = {
    origin: config.corsOrigin,
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

  // Rate limiting middleware
  app.use(generalLimiter);

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/auth', authLimiter, authRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
