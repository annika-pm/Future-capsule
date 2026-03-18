/**
 * Error Handling & Logging Module
 *
 * Standardized error types and response formatting for API routes.
 */

// Custom error classes
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(400, 'validation_error', message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, 'authentication_error', message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Unauthorized access') {
    super(403, 'authorization_error', message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, 'not_found_error', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(409, 'conflict_error', message, details);
    this.name = 'ConflictError';
  }
}

export class ServerError extends ApiError {
  constructor(
    message = 'Internal server error',
    details?: Record<string, unknown>
  ) {
    super(500, 'server_error', message, details);
    this.name = 'ServerError';
  }
}

/**
 * Standard API error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * Formats error into standardized API response
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.errorCode,
      message: error.message,
      statusCode: error.statusCode,
      timestamp,
      ...(error.details && { details: error.details }),
    };
  }

  if (error instanceof Error) {
    console.error('[Error]', error.message, error.stack);
    return {
      success: false,
      error: 'server_error',
      message: 'Internal server error',
      statusCode: 500,
      timestamp,
    };
  }

  console.error('[Unknown Error]', error);
  return {
    success: false,
    error: 'server_error',
    message: 'Internal server error',
    statusCode: 500,
    timestamp,
  };
}

/**
 * Logger for API events
 * Logs validation fails, auth fails, and errors
 */
export const logger = {
  /**
   * Log validation failure
   */
  validationFail: (userId: string | 'anonymous', field: string, reason: string) => {
    console.log(
      `[VALIDATION_FAIL] User: ${userId} | Field: ${field} | Reason: ${reason} | Time: ${new Date().toISOString()}`
    );
  },

  /**
   * Log unauthorized access attempt
   */
  unauthorizedAccess: (userId: string, resource: string, reason: string) => {
    console.warn(
      `[UNAUTHORIZED_ACCESS] User: ${userId} | Resource: ${resource} | Reason: ${reason} | Time: ${new Date().toISOString()}`
    );
  },

  /**
   * Log API error
   */
  error: (error: ApiError | Error, context?: Record<string, unknown>) => {
    if (error instanceof ApiError) {
      console.error(
        `[API_ERROR] Code: ${error.errorCode} | Status: ${error.statusCode} | Message: ${error.message} | Time: ${new Date().toISOString()}`,
        context
      );
    } else {
      console.error(
        `[ERROR] Message: ${error.message} | Time: ${new Date().toISOString()}`,
        context
      );
    }
  },

  /**
   * Log successful operation
   */
  success: (operation: string, userId: string, context?: Record<string, unknown>) => {
    console.log(
      `[SUCCESS] Operation: ${operation} | User: ${userId} | Time: ${new Date().toISOString()}`,
      context
    );
  },

  /**
   * Log info messages
   */
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] ${message} | Time: ${new Date().toISOString()}`, context);
  },
};
