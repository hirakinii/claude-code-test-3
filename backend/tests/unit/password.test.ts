import { hashPassword, comparePassword } from '../../src/utils/password';

describe('Password Utilities', () => {
  const plainPassword = 'TestPassword123!';

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const hash = await hashPassword(plainPassword);
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(plainPassword);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      // bcryptはsaltを使用するため、同じパスワードでも異なるハッシュが生成される
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2);
    });

    it('should hash empty string', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeTruthy();
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const hash = await hashPassword(plainPassword);
      const isMatch = await comparePassword(plainPassword, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hash = await hashPassword(plainPassword);
      const isMatch = await comparePassword('WrongPassword', hash);
      expect(isMatch).toBe(false);
    });

    it('should return false for empty password against hash', async () => {
      const hash = await hashPassword(plainPassword);
      const isMatch = await comparePassword('', hash);
      expect(isMatch).toBe(false);
    });

    it('should work with special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(specialPassword);
      const isMatch = await comparePassword(specialPassword, hash);
      expect(isMatch).toBe(true);
    });

    it('should be case sensitive', async () => {
      const hash = await hashPassword('Password');
      const isMatch = await comparePassword('password', hash);
      expect(isMatch).toBe(false);
    });
  });
});
