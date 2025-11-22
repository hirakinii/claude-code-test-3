import { createTextFormat, logger, stream } from '../../src/utils/logger';

describe('Logger Utilities', () => {
  describe('createTextFormat', () => {
    it('should create a winston format', () => {
      const format = createTextFormat();
      expect(format).toBeDefined();
    });

    it('should format log message without meta', () => {
      const format = createTextFormat();
      const info = {
        level: 'info',
        message: 'Test message',
        timestamp: '2025-01-01 12:00:00',
        [Symbol.for('level')]: 'info',
        [Symbol.for('message')]: 'Test message',
      };

      const result = format.transform(info);

      expect(result).toBeDefined();
      if (result && typeof result === 'object' && Symbol.for('message') in result) {
        const formattedMessage = result[Symbol.for('message') as unknown as string];
        expect(formattedMessage).toContain('2025-01-01 12:00:00');
        expect(formattedMessage).toContain('[info]');
        expect(formattedMessage).toContain('Test message');
      }
    });

    it('should format log message with meta', () => {
      const format = createTextFormat();
      const info = {
        level: 'error',
        message: 'Error occurred',
        timestamp: '2025-01-01 12:00:00',
        userId: 'user-123',
        action: 'login',
        [Symbol.for('level')]: 'error',
        [Symbol.for('message')]: 'Error occurred',
      };

      const result = format.transform(info);

      expect(result).toBeDefined();
      if (result && typeof result === 'object' && Symbol.for('message') in result) {
        const formattedMessage = result[Symbol.for('message') as unknown as string];
        expect(formattedMessage).toContain('2025-01-01 12:00:00');
        expect(formattedMessage).toContain('[error]');
        expect(formattedMessage).toContain('Error occurred');
        expect(formattedMessage).toContain('userId');
        expect(formattedMessage).toContain('user-123');
      }
    });
  });

  describe('logger', () => {
    it('should be a winston logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should have correct default meta', () => {
      expect(logger.defaultMeta).toEqual({ service: 'spec-manager-backend' });
    });
  });

  describe('stream', () => {
    let loggerInfoSpy: jest.SpyInstance;

    beforeEach(() => {
      loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
    });

    afterEach(() => {
      loggerInfoSpy.mockRestore();
    });

    it('should write trimmed message to logger.info', () => {
      stream.write('  Test log message  \n');

      expect(loggerInfoSpy).toHaveBeenCalledWith('Test log message');
    });

    it('should handle message without extra whitespace', () => {
      stream.write('Clean message');

      expect(loggerInfoSpy).toHaveBeenCalledWith('Clean message');
    });

    it('should handle empty message', () => {
      stream.write('   \n');

      expect(loggerInfoSpy).toHaveBeenCalledWith('');
    });
  });
});
