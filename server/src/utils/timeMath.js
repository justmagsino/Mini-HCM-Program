/**
 * Pure interval math for attendance computation (no timezone logic).
 */

/**
 * @param {Date} start
 * @param {Date} end
 * @returns {number} Whole minutes from start to end (0 if end <= start)
 */
export function minutesBetween(start, end) {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / 60_000);
}

/**
 * Overlap length in minutes between [startA, endA) and [startB, endB).
 * @param {Date} startA
 * @param {Date} endA
 * @param {Date} startB
 * @param {Date} endB
 */
export function overlapMinutes(startA, endA, startB, endB) {
  const overlapStart = Math.max(startA.getTime(), startB.getTime());
  const overlapEnd = Math.min(endA.getTime(), endB.getTime());

  if (overlapEnd <= overlapStart) {
    return 0;
  }

  return Math.floor((overlapEnd - overlapStart) / 60_000);
}

/**
 * @param {number} minutes
 * @returns {number} Decimal hours rounded to 2 places
 */
export function toDecimalHours(minutes) {
  return Math.round((minutes / 60) * 100) / 100;
}

/**
 * @param {Date} a
 * @param {Date} b
 */
export function maxDate(a, b) {
  return a.getTime() >= b.getTime() ? a : b;
}

/**
 * @param {Date} a
 * @param {Date} b
 */
export function minDate(a, b) {
  return a.getTime() <= b.getTime() ? a : b;
}

/**
 * @param {number} minutes
 * @param {number} maxHours
 */
export function capDecimalHoursFromMinutes(minutes, maxHours = 24) {
  const hours = toDecimalHours(minutes);
  return Math.min(hours, maxHours);
}
