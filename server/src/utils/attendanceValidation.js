import { AppError } from './errors.js';
import { getWorkDateForTimezone } from './dates.js';

/**
 * Attendance records are keyed by punch-in calendar day in the employee timezone.
 * @param {string} date
 * @param {Date} timeIn
 * @param {string} timezone
 */
export function assertWorkDateMatchesTimeIn(date, timeIn, timezone) {
  const workDate = getWorkDateForTimezone(timeIn, timezone);
  if (date !== workDate) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `date must match punch-in day (${workDate}) in the employee timezone`,
    );
  }
}
