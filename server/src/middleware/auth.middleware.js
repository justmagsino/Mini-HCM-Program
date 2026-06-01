import { adminAuth } from '../config/firebaseAdmin.js';
import { AppError } from '../utils/errors.js';
import * as usersRepository from '../repositories/users.repository.js';
import { getCachedUser, setCachedUser } from './userCache.middleware.js';

/**
 * Verifies Firebase ID token (Bearer JWT).
 * Sets req.auth = { uid, email }.
 */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    }

    const token = header.slice(7).trim();
    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing bearer token');
    }

    const decoded = await adminAuth.verifyIdToken(token, true);

    req.auth = {
      uid: decoded.uid,
      email: decoded.email ?? '',
      emailVerified: Boolean(decoded.email_verified),
    };

    return next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
  }
}

/**
 * Loads Firestore users profile into req.user (requires authenticate first).
 */
export async function requireUser(req, res, next) {
  try {
    if (!req.auth?.uid) {
      throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated');
    }

    const cached = getCachedUser(req.auth.uid);
    if (cached) {
      req.user = cached;
      return next();
    }

    const user = await usersRepository.getUserById(req.auth.uid);
    if (!user) {
      throw new AppError(404, 'PROFILE_NOT_FOUND', 'User profile not found');
    }

    setCachedUser(req.auth.uid, user);
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}
