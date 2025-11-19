import { generateToken, verifyToken, decodeToken } from '../../src/utils/jwt';

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    roles: ['CREATOR'],
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT形式確認
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(mockPayload);
      const token2 = generateToken({
        ...mockPayload,
        userId: 'different-user-id',
      });

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.roles).toEqual(mockPayload.roles);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyToken('not.a.valid.jwt.token')).toThrow();
    });

    it('should throw error for token with wrong issuer', () => {
      // 異なるissuerで生成されたトークンは検証失敗するはず
      const jwt = require('jsonwebtoken');
      const wrongIssuerToken = jwt.sign(mockPayload, process.env.JWT_SECRET, {
        issuer: 'wrong-issuer',
      });

      expect(() => verifyToken(wrongIssuerToken)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should decode even expired token', () => {
      // 期限切れのトークンでもデコードは可能（検証なし）
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(mockPayload, process.env.JWT_SECRET, {
        expiresIn: '-1s', // 1秒前に期限切れ
      });

      const decoded = decodeToken(expiredToken);
      expect(decoded?.userId).toBe(mockPayload.userId);
    });
  });
});
