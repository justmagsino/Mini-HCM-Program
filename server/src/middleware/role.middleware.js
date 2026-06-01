import { AppError } from '../utils/errors.js';

/**
 * Requires req.user.role === 'admin' (run after authenticate + requireUser).
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Not authenticated'));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError(403, 'FORBIDDEN', 'Admin access required'));
  }

  return next();
}
