import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../../utils/errors.js';

/**
 * General API rate limiter (DEVELOPMENT MODE - Very permissive)
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000'), // 10000 requests/min (dev)
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // Skip in dev mode
  handler: (req, res) => {
    throw new RateLimitError('Too many requests, please try again later');
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '1000'), // 1000 auth attempts/min (dev)
  skipSuccessfulRequests: false,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // Skip in dev mode
  handler: (req, res) => {
    throw new RateLimitError('Too many authentication attempts, please try again in 1 minute');
  },
});

/**
 * AI analysis rate limiter
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute (dev)
  message: 'Too many AI analysis requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // Skip in dev mode
  handler: (req, res) => {
    throw new RateLimitError('Too many AI requests, please wait before trying again');
  },
});
