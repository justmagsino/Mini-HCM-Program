/**
 * Pure attendance metrics engine (07-computation-engine.md).
 * No Express or Firebase imports.
 */

import {
  TIME_REGEX,
  buildNightDifferentialWindows,
  buildShiftBounds,
  parseDateString,
} from '../utils/dates.js';
import {
  capDecimalHoursFromMinutes,
  maxDate,
  minDate,
  minutesBetween,
  overlapMinutes,
  toDecimalHours,
} from '../utils/timeMath.js';
import { ComputationError } from './computation.errors.js';

const MAX_HOURS_PER_FIELD = 24;
const MAX_MINUTES_SANITY = 24 * 60;

/**
 * @typedef {object} AttendanceMetrics
 * @property {number} regularHours
 * @property {number} overtimeHours
 * @property {number} nightDifferentialHours
 * @property {number} lateMinutes
 * @property {number} undertimeMinutes
 */

/**
 * @typedef {object} ComputeAttendanceMetricsInput
 * @property {string} date YYYY-MM-DD work date (punch-in date)
 * @property {Date} timeIn
 * @property {Date} timeOut
 * @property {{ start: string; end: string }} schedule
 * @property {string} timezone IANA
 */

/**
 * @param {{ start: string; end: string }} schedule
 */
function assertValidSchedule(schedule) {
  if (!schedule?.start || !schedule?.end) {
    throw new ComputationError('VALIDATION_ERROR', 'schedule.start and schedule.end are required');
  }

  if (!TIME_REGEX.test(schedule.start) || !TIME_REGEX.test(schedule.end)) {
    throw new ComputationError('VALIDATION_ERROR', 'schedule times must be HH:mm');
  }
}

/**
 * @param {ComputeAttendanceMetricsInput} input
 */
function assertValidInput(input) {
  if (!parseDateString(input.date)) {
    throw new ComputationError('VALIDATION_ERROR', 'date must be YYYY-MM-DD');
  }

  if (!input.timezone) {
    throw new ComputationError('VALIDATION_ERROR', 'timezone is required');
  }

  if (!(input.timeIn instanceof Date) || Number.isNaN(input.timeIn.getTime())) {
    throw new ComputationError('VALIDATION_ERROR', 'timeIn must be a valid Date');
  }

  if (!(input.timeOut instanceof Date) || Number.isNaN(input.timeOut.getTime())) {
    throw new ComputationError('INVALID_ATTENDANCE_STATE', 'timeOut is required for computation');
  }

  if (input.timeOut.getTime() <= input.timeIn.getTime()) {
    throw new ComputationError('VALIDATION_ERROR', 'timeOut must be after timeIn');
  }

  assertValidSchedule(input.schedule);
}

/**
 * Step 2 — Late minutes (07 § Algorithm Step 2).
 * @param {Date} timeIn
 * @param {Date} shiftStart
 */
export function computeLateMinutes(timeIn, shiftStart) {
  if (timeIn.getTime() > shiftStart.getTime()) {
    return minutesBetween(shiftStart, timeIn);
  }
  return 0;
}

/**
 * Step 3 — Undertime minutes (07 § Algorithm Step 3).
 * @param {Date} timeOut
 * @param {Date} shiftEnd
 */
export function computeUndertimeMinutes(timeOut, shiftEnd) {
  if (timeOut.getTime() < shiftEnd.getTime()) {
    return minutesBetween(timeOut, shiftEnd);
  }
  return 0;
}

/**
 * Step 4 — Regular minutes within scheduled shift (07 § Algorithm Step 4).
 * @param {Date} timeIn
 * @param {Date} timeOut
 * @param {Date} shiftStart
 * @param {Date} shiftEnd
 */
export function computeRegularMinutes(timeIn, timeOut, shiftStart, shiftEnd) {
  const effectiveStart = maxDate(timeIn, shiftStart);
  const effectiveEnd = minDate(timeOut, shiftEnd);
  return minutesBetween(effectiveStart, effectiveEnd);
}

/**
 * Step 5 — Overtime minutes after shift end (07 § Algorithm Step 5).
 * @param {Date} timeIn
 * @param {Date} timeOut
 * @param {Date} shiftEnd
 */
export function computeOvertimeMinutes(timeIn, timeOut, shiftEnd) {
  if (timeOut.getTime() <= shiftEnd.getTime()) {
    return 0;
  }

  const otStart = maxDate(timeIn, shiftEnd);
  return minutesBetween(otStart, timeOut);
}

/**
 * Step 6 — Night differential minutes (07 § Algorithm Step 6).
 * Handles cross-midnight work via per-calendar-day ND windows.
 * @param {Date} timeIn
 * @param {Date} timeOut
 * @param {string} timezone
 */
export function computeNightDifferentialMinutes(timeIn, timeOut, timezone) {
  const windows = buildNightDifferentialWindows(timeIn, timeOut, timezone);
  let total = 0;

  for (const window of windows) {
    total += overlapMinutes(timeIn, timeOut, window.start, window.end);
  }

  return total;
}

/**
 * @param {number} minutes
 */
function sanitizeMinutes(minutes) {
  const value = Math.max(0, Math.floor(minutes));
  return Math.min(value, MAX_MINUTES_SANITY);
}

/**
 * Canonical metrics for a closed attendance interval.
 *
 * @param {ComputeAttendanceMetricsInput} input
 * @returns {AttendanceMetrics}
 */
export function computeAttendanceMetrics(input) {
  assertValidInput(input);

  const { date, timeIn, timeOut, schedule, timezone } = input;
  const { shiftStart, shiftEnd } = buildShiftBounds(date, schedule, timezone);

  const lateMinutes = sanitizeMinutes(computeLateMinutes(timeIn, shiftStart));
  const undertimeMinutes = sanitizeMinutes(computeUndertimeMinutes(timeOut, shiftEnd));
  const regularMinutes = computeRegularMinutes(timeIn, timeOut, shiftStart, shiftEnd);
  const overtimeMinutes = computeOvertimeMinutes(timeIn, timeOut, shiftEnd);
  const ndMinutes = computeNightDifferentialMinutes(timeIn, timeOut, timezone);

  return {
    regularHours: capDecimalHoursFromMinutes(regularMinutes, MAX_HOURS_PER_FIELD),
    overtimeHours: capDecimalHoursFromMinutes(overtimeMinutes, MAX_HOURS_PER_FIELD),
    nightDifferentialHours: capDecimalHoursFromMinutes(ndMinutes, MAX_HOURS_PER_FIELD),
    lateMinutes,
    undertimeMinutes,
  };
}

/**
 * Helper for services: compute from ISO strings or Dates.
 *
 * @param {{
 *   date: string;
 *   timeIn: Date | string;
 *   timeOut: Date | string;
 *   schedule: { start: string; end: string };
 *   timezone: string;
 * }} params
 * @returns {AttendanceMetrics}
 */
export function computeAttendanceMetricsFromValues(params) {
  const timeIn = params.timeIn instanceof Date ? params.timeIn : new Date(params.timeIn);
  const timeOut = params.timeOut instanceof Date ? params.timeOut : new Date(params.timeOut);

  return computeAttendanceMetrics({
    date: params.date,
    timeIn,
    timeOut,
    schedule: params.schedule,
    timezone: params.timezone,
  });
}

export { toDecimalHours };
