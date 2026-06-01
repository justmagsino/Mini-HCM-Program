import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  if (err instanceof ZodError) {
    const message = err.errors[0]?.message ?? 'Validation failed';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    });
  }

  if (err?.code === 'auth/id-token-revoked' || err?.code === 'auth/id-token-expired') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }

  if (env.NODE_ENV === 'production') {
    console.error(err.message ?? err);
  } else {
    console.error(err);
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  });
}
