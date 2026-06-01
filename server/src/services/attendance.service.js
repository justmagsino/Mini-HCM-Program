import { AppError } from '../utils/errors.js';
import {
  assertValidHistoryRange,
  getWorkDateForTimezone,
} from '../utils/dates.js';
import * as attendanceRepository from '../repositories/attendance.repository.js';
import * as attendanceWriteRepository from '../repositories/attendanceWrite.repository.js';
import { metricsToSummaryPayload } from '../utils/metrics.js';
import { calculateAttendanceMetrics } from './computation.service.js';

const PUNCH_DEBOUNCE_MS = process.env.NODE_ENV === 'test' ? 0 : 2000;
/** @type {Map<string, number>} */
const lastPunchRequestAt = new Map();

/**
 * @param {string} uid
 * @param {'in' | 'out'} action
 */
function assertPunchNotDebounced(uid, action) {
  const key = `${uid}:${action}`;
  const now = Date.now();
  const last = lastPunchRequestAt.get(key);

  if (last && now - last < PUNCH_DEBOUNCE_MS) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Please wait before punching again');
  }

  lastPunchRequestAt.set(key, now);
}

/**
 * @param {{ uid: string; timezone: string; schedule: { start: string; end: string } }} user
 */
export async function punchIn(user) {
  assertPunchNotDebounced(user.uid, 'in');

  const workDate = getWorkDateForTimezone(new Date(), user.timezone);
  const existing = await attendanceRepository.getById(user.uid, workDate);

  if (existing?.status === 'open') {
    throw new AppError(409, 'ALREADY_PUNCHED_IN', 'You are already punched in for today');
  }

  if (existing?.status === 'closed') {
    throw new AppError(409, 'ATTENDANCE_ALREADY_CLOSED', 'Attendance for today is already closed');
  }

  const timeIn = new Date();
  const attendance = await attendanceRepository.createOpen(user.uid, workDate, timeIn);
  return attendance;
}

/**
 * @param {object} user req.user shape
 */
export async function punchOut(user) {
  assertPunchNotDebounced(user.uid, 'out');

  const today = getWorkDateForTimezone(new Date(), user.timezone);
  const existing = await attendanceRepository.getById(user.uid, today);

  if (!existing || existing.status !== 'open') {
    throw new AppError(409, 'NO_OPEN_ATTENDANCE', 'No open attendance record for today');
  }

  const workDate = existing.date;
  const timeIn = new Date(existing.timeIn);
  const timeOut = new Date();

  const metrics = calculateAttendanceMetrics({
    date: workDate,
    timeIn,
    timeOut,
    schedule: user.schedule,
    timezone: user.timezone,
  });

  const { attendance, dailySummary } = await attendanceWriteRepository.closeAttendanceWithSummary(
    user.uid,
    workDate,
    { timeIn, timeOut, ...metrics },
    metricsToSummaryPayload(metrics),
  );

  return { attendance, dailySummary };
}

/**
 * @param {object} user
 */
export async function getToday(user) {
  const workDate = getWorkDateForTimezone(new Date(), user.timezone);
  const data = await attendanceRepository.getById(user.uid, workDate);
  return data;
}

/**
 * @param {object} user
 * @param {{ from: string; to: string; page?: number; limit?: number }} query
 */
export async function getHistory(user, query) {
  const range = assertValidHistoryRange(query.from, query.to);
  if (!range.ok) {
    const code = range.message.includes('exceed') ? 'RANGE_TOO_LARGE' : 'VALIDATION_ERROR';
    throw new AppError(400, code, range.message);
  }

  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 31, 93);

  const allItems = await attendanceRepository.queryByUserAndDateRange(
    user.uid,
    range.from,
    range.to,
  );

  const total = allItems.length;
  const start = (page - 1) * limit;
  const items = allItems.slice(start, start + limit);

  return { items, page, limit, total };
}
