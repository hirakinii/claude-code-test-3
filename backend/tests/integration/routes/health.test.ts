/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import request from 'supertest';
import express from 'express';
import { healthRouter } from '../../../src/routes/health';
import { prisma } from '../../../src/config/database';

describe('Health Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/health', healthRouter);
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          environment: expect.any(String),
        },
      });
    });

    it('should include timestamp in response', async () => {
      const response = await request(app).get('/health');

      expect(response.body.data.timestamp).toBeDefined();
      const timestamp = new Date(response.body.data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should include uptime in response', async () => {
      const response = await request(app).get('/health');

      expect(response.body.data.uptime).toBeDefined();
      expect(typeof response.body.data.uptime).toBe('number');
      expect(response.body.data.uptime).toBeGreaterThan(0);
    });

    it('should include environment in response', async () => {
      const response = await request(app).get('/health');

      expect(response.body.data.environment).toBeDefined();
      expect(typeof response.body.data.environment).toBe('string');
    });

    it('should return consistent response format', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          environment: expect.any(String),
        },
      });
    });
  });

  describe('GET /health/db', () => {
    it('should return healthy status when database is connected', async () => {
      const response = await request(app).get('/health/db');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          database: 'connected',
        },
      });
    });

    it('should include timestamp in response', async () => {
      const response = await request(app).get('/health/db');

      expect(response.body.data.timestamp).toBeDefined();
      const timestamp = new Date(response.body.data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return consistent response format for healthy database', async () => {
      const response = await request(app).get('/health/db');

      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'healthy',
          database: 'connected',
          timestamp: expect.any(String),
        },
      });
    });

    it('should handle database connection errors gracefully', async () => {
      // Mock Prisma to throw an error
      const originalQueryRaw = prisma.$queryRaw;
      prisma.$queryRaw = jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/health/db');

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        success: false,
        data: {
          status: 'unhealthy',
          database: 'disconnected',
          timestamp: expect.any(String),
        },
      });

      // Restore original function
      prisma.$queryRaw = originalQueryRaw;
    });

    it('should execute a simple query to verify database connection', async () => {
      const queryRawSpy = jest.spyOn(prisma, '$queryRaw');

      await request(app).get('/health/db');

      expect(queryRawSpy).toHaveBeenCalled();

      queryRawSpy.mockRestore();
    });
  });

  describe('Health check response times', () => {
    it('should respond to /health quickly (< 100ms)', async () => {
      const start = Date.now();
      await request(app).get('/health');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should respond to /health/db within reasonable time (< 1000ms)', async () => {
      const start = Date.now();
      await request(app).get('/health/db');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});
