import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/** Paths that use a dedicated limiter — skip the global API bucket to avoid double-counting. */
function hasDedicatedLimiter(req) {
  const path = req.path ?? '';
  return (
    path.startsWith('/auth') ||
    path.startsWith('/admin') ||
    path.startsWith('/summaries')
  );
}

/** Disable rate limits during local development (React strict mode + retries hit caps quickly). */
export function skipRateLimitInDevelopment() {
  return env.NODE_ENV !== 'production';
}

/**
 * @param {string} message
 */
function rateLimitBody(message) {
  return {
    error: {
      code: 'RATE_LIMITED',
      message,
    },
  };
}

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimitInDevelopment,
};

export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req, res) => skipRateLimitInDevelopment() || hasDedicatedLimiter(req),
  message: rateLimitBody('Too many API requests. Try again in a few minutes.'),
});

export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: rateLimitBody('Too many auth requests. Try again in a few minutes.'),
});

/** Stricter limit for profile registration (abuse / spam accounts). */
export const registerLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: rateLimitBody('Too many registration attempts. Try again later.'),
});

export const adminReadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: rateLimitBody('Too many admin requests. Try again in a few minutes.'),
});

export const summariesLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: rateLimitBody('Too many summary requests. Try again in a few minutes.'),
});

export const punchLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.uid ?? req.ip,
  message: rateLimitBody('Too many punch attempts. Wait a minute and try again.'),
});

export const attendanceReadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.uid ?? req.ip,
  message: rateLimitBody('Too many attendance requests. Try again in a few minutes.'),
});

export const adminWriteLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: rateLimitBody('Too many admin write requests. Try again in a few minutes.'),
});
