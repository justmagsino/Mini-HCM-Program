import { zonedTimeToUtc } from './timezone.js';

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_HISTORY_DAYS = 93;
export const DEFAULT_TIMEZONE = import.meta.env.VITE_DEFAULT_TIMEZONE || 'Asia/Manila';

/**
 * @param {Date} [instant]
 * @param {string} timezone IANA
 */
export function getWorkDateForTimezone(instant = new Date(), timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @param {number} daysBack
 */
export function subtractDaysFromDateString(dateStr, daysBack) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d - daysBack));
  const year = utc.getUTCFullYear();
  const month = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @param {number} days
 */
export function addDaysToDateString(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  const year = utc.getUTCFullYear();
  const month = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Monday of the week containing dateStr in the given timezone (matches server).
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} timezone
 */
export function getWeekStartForDate(dateStr, timezone) {
  const instant = zonedTimeToUtc(dateStr, '12:00', timezone);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(instant);

  const offsets = { Sun: -6, Mon: 0, Tue: -1, Wed: -2, Thu: -3, Fri: -4, Sat: -5 };
  const offset = offsets[weekday] ?? 0;
  return addDaysToDateString(dateStr, offset);
}

/**
 * @param {string} timezone
 */
export function getCurrentWeekStart(timezone) {
  const today = getWorkDateForTimezone(new Date(), timezone);
  return getWeekStartForDate(today, timezone);
}
