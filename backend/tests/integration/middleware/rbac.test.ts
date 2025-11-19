import { requireRole, requireAdmin, requireCreator } from '../../../src/middleware/rbac';
import { AuthRequest } from '../../../src/middleware/auth';
import { Response } from 'express';

describe('RBAC Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', () => {
      mockReq.user = {
        userId: 'test-user',
        email: 'test@example.com',
        roles: ['CREATOR'],
      };

      const middleware = requireRole('CREATOR');
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks required role', () => {
      mockReq.user = {
        userId: 'test-user',
        email: 'test@example.com',
        roles: ['CREATOR'],
      };

      const middleware = requireRole('ADMINISTRATOR');
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    });

    it('should deny access when user is not authenticated', () => {
      mockReq.user = undefined;

      const middleware = requireRole('CREATOR');
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should allow access when user has any of the required roles', () => {
      mockReq.user = {
        userId: 'test-user',
        email: 'test@example.com',
        roles: ['CREATOR'],
      };

      const middleware = requireRole('ADMINISTRATOR', 'CREATOR');
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle users with multiple roles', () => {
      mockReq.user = {
        userId: 'admin-user',
        email: 'admin@example.com',
        roles: ['ADMINISTRATOR', 'CREATOR'],
      };

      const adminMiddleware = requireRole('ADMINISTRATOR');
      adminMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for administrators', () => {
      mockReq.user = {
        userId: 'admin-user',
        email: 'admin@example.com',
        roles: ['ADMINISTRATOR'],
      };

      requireAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for non-administrators', () => {
      mockReq.user = {
        userId: 'creator-user',
        email: 'creator@example.com',
        roles: ['CREATOR'],
      };

      requireAdmin(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireCreator', () => {
    it('should allow access for creators', () => {
      mockReq.user = {
        userId: 'creator-user',
        email: 'creator@example.com',
        roles: ['CREATOR'],
      };

      requireCreator(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access for administrators', () => {
      mockReq.user = {
        userId: 'admin-user',
        email: 'admin@example.com',
        roles: ['ADMINISTRATOR'],
      };

      requireCreator(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for users without creator or admin role', () => {
      mockReq.user = {
        userId: 'other-user',
        email: 'other@example.com',
        roles: ['SOME_OTHER_ROLE'],
      };

      requireCreator(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
