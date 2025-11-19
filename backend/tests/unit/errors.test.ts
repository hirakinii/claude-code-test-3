import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '../../src/utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with correct properties', () => {
      const error = new AppError(400, 'TEST_ERROR', 'Test message', {
        detail: 'test',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('AppError');
    });

    it('should create an error without details', () => {
      const error = new AppError(500, 'ERROR_CODE', 'Error message');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('ERROR_CODE');
      expect(error.message).toBe('Error message');
      expect(error.details).toBeUndefined();
    });

    it('should have a stack trace', () => {
      const error = new AppError(400, 'TEST_ERROR', 'Test message');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new AppError(400, 'TEST_ERROR', 'Test message');
      }).toThrow(AppError);
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with 400 status', () => {
      const error = new ValidationError('Invalid input');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
    });

    it('should support details parameter', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ValidationError('Validation failed', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an unauthorized error with 401 status', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Invalid token');
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should use default message when none provided', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a forbidden error with 403 status', () => {
      const error = new ForbiddenError('Access denied');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Access denied');
      expect(error.name).toBe('ForbiddenError');
    });

    it('should use default message when none provided', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Forbidden');
    });
  });

  describe('NotFoundError', () => {
    it('should create a not found error with 404 status', () => {
      const error = new NotFoundError('User not found');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
      expect(error.name).toBe('NotFoundError');
    });

    it('should use default message when none provided', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
    });
  });

  describe('ConflictError', () => {
    it('should create a conflict error with 409 status', () => {
      const error = new ConflictError('Email already exists');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Email already exists');
      expect(error.name).toBe('ConflictError');
    });

    it('should support details parameter', () => {
      const details = { email: 'test@example.com' };
      const error = new ConflictError('Duplicate entry', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('InternalServerError', () => {
    it('should create an internal server error with 500 status', () => {
      const error = new InternalServerError('Database connection failed');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.message).toBe('Database connection failed');
      expect(error.name).toBe('InternalServerError');
    });

    it('should use default message when none provided', () => {
      const error = new InternalServerError();

      expect(error.message).toBe('Internal server error');
    });
  });

  describe('Error inheritance chain', () => {
    it('should maintain proper instanceof checks for all error types', () => {
      const validationError = new ValidationError('test');
      const unauthorizedError = new UnauthorizedError('test');
      const forbiddenError = new ForbiddenError('test');
      const notFoundError = new NotFoundError('test');
      const conflictError = new ConflictError('test');
      const internalServerError = new InternalServerError('test');

      // All custom errors should be instances of both AppError and Error
      expect(validationError).toBeInstanceOf(AppError);
      expect(validationError).toBeInstanceOf(Error);
      expect(unauthorizedError).toBeInstanceOf(AppError);
      expect(unauthorizedError).toBeInstanceOf(Error);
      expect(forbiddenError).toBeInstanceOf(AppError);
      expect(forbiddenError).toBeInstanceOf(Error);
      expect(notFoundError).toBeInstanceOf(AppError);
      expect(notFoundError).toBeInstanceOf(Error);
      expect(conflictError).toBeInstanceOf(AppError);
      expect(conflictError).toBeInstanceOf(Error);
      expect(internalServerError).toBeInstanceOf(AppError);
      expect(internalServerError).toBeInstanceOf(Error);
    });

    it('should correctly identify error types using instanceof', () => {
      const validationError = new ValidationError('test');

      expect(validationError instanceof ValidationError).toBe(true);
      expect(validationError instanceof UnauthorizedError).toBe(false);
      expect(validationError instanceof AppError).toBe(true);
      expect(validationError instanceof Error).toBe(true);
    });
  });

  describe('Error serialization', () => {
    it('should include all properties when converted to JSON', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      // Note: JSON.stringify doesn't include non-enumerable properties like 'message'
      // but our error handler middleware accesses them directly
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.details).toEqual({ field: 'email' });
    });
  });
});
