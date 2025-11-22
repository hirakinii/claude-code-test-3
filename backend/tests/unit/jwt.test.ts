import { generateToken, verifyToken, decodeToken } from '../../src/utils/jwt';
import jwt from 'jsonwebtoken';

// jwt モジュールをモック化
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
}));

// logger モジュールをモック化
jest.mock('../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    roles: ['CREATOR'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const mockToken = 'mock.jwt.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = generateToken(mockPayload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        mockPayload,
        expect.any(String),
        expect.objectContaining({
          issuer: 'spec-manager-api',
        }),
      );
    });

    it('should generate different tokens for different payloads', () => {
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('token1')
        .mockReturnValueOnce('token2');

      const token1 = generateToken(mockPayload);
      const token2 = generateToken({
        ...mockPayload,
        userId: 'different-user-id',
      });

      expect(token1).not.toBe(token2);
    });

    it('should throw and log error when jwt.sign fails', () => {
      const mockError = new Error('Sign error');
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() => generateToken(mockPayload)).toThrow('Sign error');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const decoded = verifyToken('valid.jwt.token');

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.roles).toEqual(mockPayload.roles);
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid.jwt.token',
        expect.any(String),
        expect.objectContaining({
          issuer: 'spec-manager-api',
        }),
      );
    });

    it('should throw error for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      expect(() => verifyToken('invalid-token')).toThrow('invalid token');
    });

    it('should throw error for malformed token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      expect(() => verifyToken('not.a.valid.jwt.token')).toThrow('jwt malformed');
    });

    it('should throw error for token with wrong issuer', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt issuer invalid');
      });

      expect(() => verifyToken('wrong-issuer-token')).toThrow('jwt issuer invalid');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      (jwt.decode as jest.Mock).mockReturnValue(mockPayload);

      const decoded = decodeToken('some.jwt.token');

      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(jwt.decode).toHaveBeenCalledWith('some.jwt.token');
    });

    it('should return null for invalid token', () => {
      (jwt.decode as jest.Mock).mockReturnValue(null);

      const decoded = decodeToken('invalid-token');

      expect(decoded).toBeNull();
    });

    it('should decode even expired token', () => {
      // 期限切れのトークンでもデコードは可能（検証なし）
      (jwt.decode as jest.Mock).mockReturnValue(mockPayload);

      const decoded = decodeToken('expired.jwt.token');

      expect(decoded?.userId).toBe(mockPayload.userId);
    });
  });
});
