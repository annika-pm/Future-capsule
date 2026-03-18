/**
 * Unit Tests for Error Handling
 * Tests error classes and response formatting
 */

import {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ServerError,
  formatErrorResponse,
  logger,
} from '@/lib/errors';

describe('Error Classes', () => {
  describe('ApiError', () => {
    it('should create error with status code and error code', () => {
      const error = new ApiError(400, 'test_error', 'Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('test_error');
      expect(error.message).toBe('Test error message');
    });

    it('should include details when provided', () => {
      const details = { field: 'email', reason: 'Invalid' };
      const error = new ApiError(400, 'test_error', 'Test', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('ValidationError', () => {
    it('should have 400 status code', () => {
      const error = new ValidationError('Invalid data');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('validation_error');
    });

    it('should accept error details', () => {
      const details = { title: 'Title is required' };
      const error = new ValidationError('Invalid data', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('AuthenticationError', () => {
    it('should have 401 status code', () => {
      const error = new AuthenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('authentication_error');
    });

    it('should have default message', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication required');
    });

    it('should accept custom message', () => {
      const error = new AuthenticationError('Custom auth error');
      expect(error.message).toBe('Custom auth error');
    });
  });

  describe('AuthorizationError', () => {
    it('should have 403 status code', () => {
      const error = new AuthorizationError();
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('authorization_error');
    });

    it('should have default message', () => {
      const error = new AuthorizationError();
      expect(error.message).toBe('Unauthorized access');
    });
  });

  describe('NotFoundError', () => {
    it('should have 404 status code', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('not_found_error');
    });
  });

  describe('ConflictError', () => {
    it('should have 409 status code', () => {
      const error = new ConflictError('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe('conflict_error');
    });
  });

  describe('ServerError', () => {
    it('should have 500 status code', () => {
      const error = new ServerError();
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('server_error');
    });

    it('should have default message', () => {
      const error = new ServerError();
      expect(error.message).toBe('Internal server error');
    });

    it('should accept custom message', () => {
      const error = new ServerError('Database connection failed');
      expect(error.message).toBe('Database connection failed');
    });
  });
});

describe('formatErrorResponse', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should format ApiError correctly', () => {
    const error = new ValidationError('Invalid data');
    const response = formatErrorResponse(error);

    expect(response).toEqual({
      success: false,
      error: 'validation_error',
      message: 'Invalid data',
      statusCode: 400,
      timestamp: '2025-01-01T00:00:00.000Z',
    });
  });

  it('should include details in response', () => {
    const details = { field: 'email' };
    const error = new ValidationError('Invalid', details);
    const response = formatErrorResponse(error);

    expect(response.details).toEqual(details);
  });

  it('should format generic Error', () => {
    const error = new Error('Something went wrong');
    const response = formatErrorResponse(error);

    expect(response.success).toBe(false);
    expect(response.error).toBe('server_error');
    expect(response.statusCode).toBe(500);
  });

  it('should handle non-Error objects', () => {
    const response = formatErrorResponse('Unknown error');

    expect(response.success).toBe(false);
    expect(response.error).toBe('server_error');
    expect(response.statusCode).toBe(500);
  });

  it('should include timestamp', () => {
    const error = new ValidationError('Invalid');
    const response = formatErrorResponse(error);

    expect(response.timestamp).toBeDefined();
    expect(new Date(response.timestamp)).toBeInstanceOf(Date);
  });
});

describe('logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should log validation failures', () => {
    logger.validationFail('user-123', 'email', 'Invalid format');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[VALIDATION_FAIL]')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('user-123')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('email')
    );
  });

  it('should log unauthorized access attempts', () => {
    const warnSpy = jest.spyOn(console, 'warn');
    logger.unauthorizedAccess('user-123', 'capsule-456', 'Not owner');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[UNAUTHORIZED_ACCESS]')
    );
  });

  it('should log API errors', () => {
    const errorSpy = jest.spyOn(console, 'error');
    const error = new ValidationError('Invalid');
    logger.error(error);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[API_ERROR]')
    );
  });
});
