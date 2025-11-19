import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  notFoundHandler,
} from '../../../src/middleware/errorHandler';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '../../../src/utils/errors';

describe('Error Handler Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('errorHandler', () => {
    it('should handle ValidationError with 400 status', async () => {
      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new ValidationError('Invalid input', { field: 'email' }));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'email' },
        },
      });
    });

    it('should handle UnauthorizedError with 401 status', async () => {
      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new UnauthorizedError('Invalid credentials'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      });
    });

    it('should handle ForbiddenError with 403 status', async () => {
      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new ForbiddenError('Access denied'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    });

    it('should handle NotFoundError with 404 status', async () => {
      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new NotFoundError('User not found'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    });

    it('should handle ConflictError with 409 status', async () => {
      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(
          new ConflictError('Email already exists', {
            email: 'test@example.com',
          }),
        );
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Email already exists',
          details: { email: 'test@example.com' },
        },
      });
    });

    it('should handle InternalServerError with 500 status', async () => {
      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new InternalServerError('Database connection failed'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection failed',
        },
      });
    });

    it('should handle generic AppError', async () => {
      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new AppError(418, 'TEAPOT', 'I am a teapot'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(418);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'TEAPOT',
          message: 'I am a teapot',
        },
      });
    });

    it('should handle non-AppError as 500 in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        next(new Error('Unexpected error'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should include error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
        const error = new Error('Unexpected error');
        error.stack = 'Error stack trace';
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(response.body.error.details).toBe('Unexpected error');
      expect(response.body.error.stack).toBe('Error stack trace');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for non-existent routes', async () => {
      app.use(notFoundHandler);

      const response = await request(app).get('/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /non-existent not found',
        },
      });
    });

    it('should handle POST requests', async () => {
      app.use(notFoundHandler);

      const response = await request(app).post('/api/unknown');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route POST /api/unknown not found',
        },
      });
    });

    it('should handle PUT requests', async () => {
      app.use(notFoundHandler);

      const response = await request(app).put('/api/resource/123');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('PUT');
    });

    it('should handle DELETE requests', async () => {
      app.use(notFoundHandler);

      const response = await request(app).delete('/api/resource/123');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('DELETE');
    });
  });
});
