import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import * as usersRepository from '../repositories/users.repository.js';

/**
 * @param {string} uid
 * @param {string} email
 * @param {string} fullName
 */
export async function registerProfile(uid, email, fullName) {
  if (!env.ALLOW_PUBLIC_REGISTER) {
    throw new AppError(403, 'FORBIDDEN', 'Public registration is disabled');
  }

  const exists = await usersRepository.userExists(uid);
  if (exists) {
    throw new AppError(409, 'PROFILE_EXISTS', 'User profile already exists');
  }

  return usersRepository.createUser(uid, {
    fullName,
    email,
    role: 'employee',
    timezone: env.DEFAULT_TIMEZONE,
    schedule: {
      start: env.DEFAULT_SHIFT_START,
      end: env.DEFAULT_SHIFT_END,
    },
  });
}

/**
 * @param {string} uid
 */
export async function getProfileByUid(uid) {
  const user = await usersRepository.getUserById(uid);
  if (!user) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'User profile not found');
  }
  return user;
}
