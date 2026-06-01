import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

/**
 * In production, requires Firebase Auth email_verified on the ID token.
 * Run after authenticate (req.auth must be set).
 */
export function requireVerifiedEmail(req, res, next) {
  if (env.NODE_ENV !== 'production') {
    return next();
  }

  if (!req.auth?.emailVerified) {
    return next(
      new AppError(
        403,
        'EMAIL_NOT_VERIFIED',
        'Verify your email address before using this application',
      ),
    );
  }

  return next();
}
