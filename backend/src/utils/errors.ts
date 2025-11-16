/**
 * Custom Error Classes for ReqSploit
 */

import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class InsufficientTokensError extends AppError {
  constructor(message: string = 'Insufficient AI tokens') {
    super(message, 402, 'INSUFFICIENT_TOKENS');
  }
}

export class ProxyError extends AppError {
  constructor(message: string) {
    super(message, 500, 'PROXY_ERROR');
  }
}

export class CertificateError extends AppError {
  constructor(message: string) {
    super(message, 500, 'CERTIFICATE_ERROR');
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, statusCode: number = 503, public originalError?: unknown) {
    super(message, statusCode, 'AI_SERVICE_ERROR');
  }
}

/**
 * Error response formatter
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    errors?: unknown;
    stack?: string;
  };
}

export function formatErrorResponse(error: Error | AppError): ErrorResponse {
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode,
      },
    };

    if (error.code) response.error.code = error.code;
    if (error instanceof ValidationError && error.errors) response.error.errors = error.errors;
    if (isDevelopment && error.stack) response.error.stack = error.stack;

    return response;
  }

  // Unknown errors (don't expose details in production)
  const response: ErrorResponse = {
    success: false,
    error: {
      message: isDevelopment ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
  };

  if (isDevelopment && error.stack) response.error.stack = error.stack;

  return response;
}

/**
 * Async error wrapper for Express routes
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
