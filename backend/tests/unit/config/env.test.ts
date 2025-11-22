import {
  createConfig,
  validateRequiredEnvVars,
  warnIfDefaultJwtSecret,
  Config,
} from '../../../src/config/env';

describe('Environment Configuration', () => {
  describe('createConfig', () => {
    it('should use environment variables when provided', () => {
      const mockEnv: NodeJS.ProcessEnv = {
        PORT: '4000',
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost:5432/testdb',
        JWT_SECRET: 'my-secret-key',
        JWT_EXPIRES_IN: '1d',
        CORS_ORIGIN: 'https://example.com',
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX_REQUESTS: '50',
      };

      const config = createConfig(mockEnv);

      expect(config.port).toBe(4000);
      expect(config.nodeEnv).toBe('production');
      expect(config.databaseUrl).toBe('postgresql://localhost:5432/testdb');
      expect(config.jwtSecret).toBe('my-secret-key');
      expect(config.jwtExpiresIn).toBe('1d');
      expect(config.corsOrigin).toBe('https://example.com');
      expect(config.rateLimitWindowMs).toBe(60000);
      expect(config.rateLimitMaxRequests).toBe(50);
    });

    it('should use default values when environment variables are not provided', () => {
      const emptyEnv: NodeJS.ProcessEnv = {};

      const config = createConfig(emptyEnv);

      expect(config.port).toBe(3001);
      expect(config.nodeEnv).toBe('development');
      expect(config.databaseUrl).toBe('');
      expect(config.jwtSecret).toBe('');
      expect(config.jwtExpiresIn).toBe('7d');
      expect(config.corsOrigin).toBe('http://localhost:3000');
      expect(config.rateLimitWindowMs).toBe(900000);
      expect(config.rateLimitMaxRequests).toBe(100);
    });

    it('should handle partial environment variables', () => {
      const partialEnv: NodeJS.ProcessEnv = {
        PORT: '5000',
        DATABASE_URL: 'postgresql://localhost:5432/mydb',
      };

      const config = createConfig(partialEnv);

      expect(config.port).toBe(5000);
      expect(config.databaseUrl).toBe('postgresql://localhost:5432/mydb');
      // Default values for missing ones
      expect(config.nodeEnv).toBe('development');
      expect(config.jwtSecret).toBe('');
      expect(config.jwtExpiresIn).toBe('7d');
      expect(config.corsOrigin).toBe('http://localhost:3000');
      expect(config.rateLimitWindowMs).toBe(900000);
      expect(config.rateLimitMaxRequests).toBe(100);
    });

    it('should parse PORT as integer', () => {
      const config = createConfig({ PORT: '8080' });
      expect(config.port).toBe(8080);
      expect(typeof config.port).toBe('number');
    });

    it('should parse RATE_LIMIT_WINDOW_MS as integer', () => {
      const config = createConfig({ RATE_LIMIT_WINDOW_MS: '120000' });
      expect(config.rateLimitWindowMs).toBe(120000);
      expect(typeof config.rateLimitWindowMs).toBe('number');
    });

    it('should parse RATE_LIMIT_MAX_REQUESTS as integer', () => {
      const config = createConfig({ RATE_LIMIT_MAX_REQUESTS: '200' });
      expect(config.rateLimitMaxRequests).toBe(200);
      expect(typeof config.rateLimitMaxRequests).toBe('number');
    });
  });

  describe('validateRequiredEnvVars', () => {
    it('should not throw when all required variables are present', () => {
      const validEnv: NodeJS.ProcessEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/testdb',
        JWT_SECRET: 'secret-key',
      };

      expect(() => validateRequiredEnvVars(validEnv)).not.toThrow();
    });

    it('should throw when DATABASE_URL is missing', () => {
      const invalidEnv: NodeJS.ProcessEnv = {
        JWT_SECRET: 'secret-key',
      };

      expect(() => validateRequiredEnvVars(invalidEnv)).toThrow(
        'Environment variable DATABASE_URL is required but not defined',
      );
    });

    it('should throw when JWT_SECRET is missing', () => {
      const invalidEnv: NodeJS.ProcessEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/testdb',
      };

      expect(() => validateRequiredEnvVars(invalidEnv)).toThrow(
        'Environment variable JWT_SECRET is required but not defined',
      );
    });

    it('should throw when both required variables are missing', () => {
      const emptyEnv: NodeJS.ProcessEnv = {};

      expect(() => validateRequiredEnvVars(emptyEnv)).toThrow(
        'Environment variable DATABASE_URL is required but not defined',
      );
    });

    it('should validate custom required variables', () => {
      const env: NodeJS.ProcessEnv = {
        CUSTOM_VAR: 'value',
      };

      expect(() =>
        validateRequiredEnvVars(env, ['CUSTOM_VAR']),
      ).not.toThrow();
    });

    it('should throw for missing custom required variable', () => {
      const env: NodeJS.ProcessEnv = {};

      expect(() =>
        validateRequiredEnvVars(env, ['CUSTOM_VAR']),
      ).toThrow('Environment variable CUSTOM_VAR is required but not defined');
    });

    it('should treat empty string as missing', () => {
      const envWithEmpty: NodeJS.ProcessEnv = {
        DATABASE_URL: '',
        JWT_SECRET: 'secret',
      };

      expect(() => validateRequiredEnvVars(envWithEmpty)).toThrow(
        'Environment variable DATABASE_URL is required but not defined',
      );
    });
  });

  describe('warnIfDefaultJwtSecret', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should warn when using default JWT_SECRET in development', () => {
      const devConfig: Config = {
        port: 3001,
        nodeEnv: 'development',
        databaseUrl: 'postgresql://localhost:5432/testdb',
        jwtSecret: 'dev_jwt_secret_change_this_in_production_12345678',
        jwtExpiresIn: '7d',
        corsOrigin: 'http://localhost:3000',
        rateLimitWindowMs: 900000,
        rateLimitMaxRequests: 100,
      };

      warnIfDefaultJwtSecret(devConfig);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️  WARNING: Using default JWT_SECRET in development. Change this in production!',
      );
    });

    it('should not warn when using custom JWT_SECRET in development', () => {
      const devConfig: Config = {
        port: 3001,
        nodeEnv: 'development',
        databaseUrl: 'postgresql://localhost:5432/testdb',
        jwtSecret: 'custom-secret-key',
        jwtExpiresIn: '7d',
        corsOrigin: 'http://localhost:3000',
        rateLimitWindowMs: 900000,
        rateLimitMaxRequests: 100,
      };

      warnIfDefaultJwtSecret(devConfig);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn in production environment', () => {
      const prodConfig: Config = {
        port: 3001,
        nodeEnv: 'production',
        databaseUrl: 'postgresql://localhost:5432/testdb',
        jwtSecret: 'dev_jwt_secret_change_this_in_production_12345678',
        jwtExpiresIn: '7d',
        corsOrigin: 'http://localhost:3000',
        rateLimitWindowMs: 900000,
        rateLimitMaxRequests: 100,
      };

      warnIfDefaultJwtSecret(prodConfig);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn in test environment', () => {
      const testConfig: Config = {
        port: 3001,
        nodeEnv: 'test',
        databaseUrl: 'postgresql://localhost:5432/testdb',
        jwtSecret: 'dev_jwt_secret_change_this_in_production_12345678',
        jwtExpiresIn: '7d',
        corsOrigin: 'http://localhost:3000',
        rateLimitWindowMs: 900000,
        rateLimitMaxRequests: 100,
      };

      warnIfDefaultJwtSecret(testConfig);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn in staging environment', () => {
      const stagingConfig: Config = {
        port: 3001,
        nodeEnv: 'staging',
        databaseUrl: 'postgresql://localhost:5432/testdb',
        jwtSecret: 'dev_jwt_secret_change_this_in_production_12345678',
        jwtExpiresIn: '7d',
        corsOrigin: 'http://localhost:3000',
        rateLimitWindowMs: 900000,
        rateLimitMaxRequests: 100,
      };

      warnIfDefaultJwtSecret(stagingConfig);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
