import request from 'supertest';
import { createServer } from '../../src/server';

describe('Authentication API', () => {
  const app = createServer();

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials (creator)', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'creator@example.com',
        password: 'Creator123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeTruthy();
      expect(response.body.data.user.email).toBe('creator@example.com');
      expect(response.body.data.user.fullName).toBe('作成者テストユーザー');
      expect(response.body.data.user.roles).toContain('CREATOR');
    });

    it('should login with valid credentials (admin)', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'admin@example.com',
        password: 'Admin123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeTruthy();
      expect(response.body.data.user.email).toBe('admin@example.com');
      expect(response.body.data.user.fullName).toBe('管理者テストユーザー');
      expect(response.body.data.user.roles).toContain('ADMINISTRATOR');
      expect(response.body.data.user.roles).toContain('CREATOR');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'creator@example.com',
        password: 'WrongPassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'SomePassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
    });

    it('should fail with missing email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        password: 'SomePassword',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with missing password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return user ID in response', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'creator@example.com',
        password: 'Creator123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.user.id).toBeTruthy();
      expect(typeof response.body.data.user.id).toBe('string');
    });
  });
});
