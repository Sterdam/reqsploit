import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  if (error instanceof AppError && error.isOperational) {
    logger.warn('Operational error', {
      error: error.message,
      code: error.code,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error('Unexpected error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Format and send error response
  const errorResponse = formatErrorResponse(error);
  res.status(errorResponse.error.statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
    },
  });
}
