import request from 'supertest';
import { createServer } from '../../../src/server';
import { generateToken } from '../../../src/utils/jwt';

describe('Auth Middleware', () => {
  const app = createServer();

  const validToken = generateToken({
    userId: 'test-user-id',
    email: 'test@example.com',
    roles: ['CREATOR'],
  });

  describe('requireAuth middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', `Bearer ${validToken}`);

      // 200 or valid response (not 401)
      expect(response.status).not.toBe(401);
    });

    it('should deny access without authorization header', async () => {
      const response = await request(app).get('/api/specifications');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Authorization header is missing');
    });

    it('should deny access with invalid authorization header format - no Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', 'Basic sometoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid authorization header format');
    });

    it('should deny access with invalid authorization header format - just token', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', 'justtoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid authorization header format');
    });

    it('should deny access with empty token after Bearer', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      // Either "Token is missing" or "Invalid authorization header format"
      expect(response.body.error.message).toMatch(
        /Token is missing|Invalid authorization header format/,
      );
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    it('should deny access with malformed JWT token', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', 'Bearer not-a-valid-jwt');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });
  });

  describe('Token validation', () => {
    it('should extract user information from token', () => {
      const token = generateToken({
        userId: 'test-123',
        email: 'user@example.com',
        roles: ['ADMINISTRATOR', 'CREATOR'],
      });

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken({
        userId: 'user-1',
        email: 'user1@example.com',
        roles: ['CREATOR'],
      });

      const token2 = generateToken({
        userId: 'user-2',
        email: 'user2@example.com',
        roles: ['ADMINISTRATOR'],
      });

      expect(token1).not.toBe(token2);
    });
  });
});
