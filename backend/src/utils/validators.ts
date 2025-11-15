import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errors.js';

/**
 * Validation Schemas
 */

// User Registration
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

// User Login
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Refresh Token
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// AI Analysis Request
export const aiAnalysisSchema = z.object({
  requestLogId: z.string().uuid('Invalid request log ID'),
  analysisType: z.enum(['QUICK', 'DEEP', 'EXPLOIT', 'EXPLAIN']),
  userContext: z.string().max(1000).optional(),
});

// Proxy Session Settings
export const proxySessionSettingsSchema = z.object({
  interceptMode: z.boolean().optional(),
  filters: z
    .object({
      methods: z.array(z.string()).optional(),
      domains: z.array(z.string()).optional(),
      statusCodes: z.array(z.number()).optional(),
    })
    .optional(),
});

// Request Modification
export const requestModificationSchema = z.object({
  requestId: z.string().uuid(),
  modifications: z.object({
    method: z.string().optional(),
    url: z.string().url().optional(),
    headers: z.record(z.string()).optional(),
    body: z.string().optional(),
  }),
});

/**
 * Validation Middleware Factory
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Query Parameter Validator
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError('Query validation failed', errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Params Validator
 */
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError('Params validation failed', errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Email validator
 */
export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

/**
 * UUID validator
 */
export function isValidUUID(id: string): boolean {
  return z.string().uuid().safeParse(id).success;
}

/**
 * Port validator
 */
export function isValidPort(port: number): boolean {
  return z.number().int().min(1).max(65535).safeParse(port).success;
}
