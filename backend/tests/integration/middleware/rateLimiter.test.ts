import request from 'supertest';
import express from 'express';
import {
  generalLimiter,
  authLimiter,
} from '../../../src/middleware/rateLimiter';

describe('Rate Limiter Middleware', () => {
  describe('generalLimiter', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(generalLimiter);
      app.get('/test', (_req, res) => {
        res.json({ success: true, data: 'OK' });
      });
    });

    it('should allow requests within the rate limit', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: 'OK' });
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    it('should not include legacy X-RateLimit headers', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-ratelimit-limit']).toBeUndefined();
      expect(response.headers['x-ratelimit-remaining']).toBeUndefined();
    });

    // Note: Testing actual rate limit exceeded is difficult in unit tests
    // as it requires making 100+ requests in rapid succession.
    // This would be better tested in E2E tests with a lower limit.
  });

  describe('authLimiter', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(authLimiter);
      app.post('/auth/login', (_req, res) => {
        res.json({ success: true, data: { token: 'test-token' } });
      });
    });

    it('should allow requests within the rate limit', async () => {
      const response = await request(app).post('/auth/login');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).post('/auth/login');

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    it('should skip health check endpoints', async () => {
      app.get('/health', (_req, res) => {
        res.json({ success: true, data: { status: 'healthy' } });
      });

      // Make multiple health check requests - should not be rate limited
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
      }
    });

    it('should have a stricter limit than generalLimiter', async () => {
      const response = await request(app).post('/auth/login');

      const limit = parseInt(response.headers['ratelimit-limit'] || '0', 10);
      expect(limit).toBe(5); // Auth limiter has max of 5
    });
  });

  describe('Rate limit exceeded response format', () => {
    let app: express.Application;

    beforeEach(() => {
      // Create a very restrictive rate limiter for testing
      const testLimiter = require('express-rate-limit').default({
        windowMs: 15 * 60 * 1000,
        max: 1, // Only 1 request allowed
        message: {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
          },
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

      app = express();
      app.use(testLimiter);
      app.get('/test', (_req, res) => {
        res.json({ success: true });
      });
    });

    it('should return proper error format when rate limit is exceeded', async () => {
      // First request should succeed
      const firstResponse = await request(app).get('/test');
      expect(firstResponse.status).toBe(200);

      // Second request should be rate limited
      const secondResponse = await request(app).get('/test');
      expect(secondResponse.status).toBe(429);
      expect(secondResponse.body).toEqual({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      });
    });
  });
});
