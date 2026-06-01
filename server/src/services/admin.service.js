import { Timestamp } from 'firebase-admin/firestore';
import { env } from '../config/env.js';
import { adminAuth } from '../config/firebaseAdmin.js';
import { AppError } from '../utils/errors.js';
import {
  getWorkDateForTimezone,
  parseDateString,
  subtractDaysFromDateString as subtractDays,
  MAX_EMPLOYEE_LIST,
} from '../utils/dates.js';
import { filterByQuery, paginate, enrichAttendanceRow } from '../utils/adminHelpers.js';
import { assertWorkDateMatchesTimeIn } from '../utils/attendanceValidation.js';
import { metricsToSummaryPayload } from '../utils/metrics.js';
import { calculateAttendanceMetrics } from './computation.service.js';
import * as usersRepository from '../repositories/users.repository.js';
import * as attendanceRepository from '../repositories/attendance.repository.js';
import * as attendanceWriteRepository from '../repositories/attendanceWrite.repository.js';
import * as dailySummaryRepository from '../repositories/dailySummary.repository.js';
import { invalidateUserCache } from '../middleware/userCache.middleware.js';
import { aggregateTotals } from '../utils/summaryAggregate.js';

const RECENT_ATTENDANCE_DAYS = 14;

/**
 * @param {string} adminUid
 * @param {string} reason
 */
function buildCorrectionMeta(adminUid, reason) {
  return {
    lastCorrectionReason: reason,
    lastCorrectedAt: Timestamp.now(),
    lastCorrectedBy: adminUid,
  };
}

/**
 * @param {{ q?: string; role?: string; page?: number; limit?: number }} query
 */
export async function listUsers(query) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 10, 100);

  let users = await usersRepository.listUsers(
    query.role ? { role: query.role, limit: MAX_EMPLOYEE_LIST } : { limit: MAX_EMPLOYEE_LIST },
  );
  users = filterByQuery(users, query.q);

  return paginate(users, page, limit);
}

/**
 * @param {string} uid
 */
export async function getUserDetail(uid) {
  const user = await usersRepository.getUserById(uid);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const timezone = user.timezone || env.DEFAULT_TIMEZONE;
  const schedule = user.schedule ?? {
    start: env.DEFAULT_SHIFT_START,
    end: env.DEFAULT_SHIFT_END,
  };
  const to = getWorkDateForTimezone(new Date(), timezone);
  const from = subtractDays(to, RECENT_ATTENDANCE_DAYS - 1);

  let recentAttendance;
  try {
    recentAttendance = await attendanceRepository.queryByUserAndDateRange(uid, from, to);
  } catch (err) {
    console.error('getUserDetail attendance query failed:', err);
    throw new AppError(
      503,
      'ATTENDANCE_QUERY_FAILED',
      'Could not load recent attendance. Run npm run deploy:firestore to deploy indexes, then try again.',
    );
  }

  return {
    user: { ...user, timezone, schedule },
    recentAttendance,
  };
}

/**
 * @param {string} uid
 * @param {{ fullName?: string; timezone?: string; schedule?: { start: string; end: string } }} body
 */
export async function updateUser(uid, body) {
  const user = await usersRepository.updateUser(uid, body);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  invalidateUserCache(uid);
  return user;
}

/**
 * @param {string} actorUid
 * @param {string} targetUid
 * @param {'employee' | 'admin'} role
 */
export async function updateUserRole(actorUid, targetUid, role) {
  if (actorUid === targetUid) {
    throw new AppError(403, 'FORBIDDEN', 'Cannot change your own role');
  }

  const target = await usersRepository.getUserById(targetUid);
  if (!target) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (target.role === 'admin' && role === 'employee') {
    const adminCount = await usersRepository.countByRole('admin');
    if (adminCount <= 1) {
      throw new AppError(409, 'LAST_ADMIN', 'Cannot demote the only admin');
    }
  }

  const updated = await usersRepository.updateUserRole(targetUid, role);
  invalidateUserCache(targetUid);
  console.info(
    JSON.stringify({
      action: 'admin.user.role',
      actorUid,
      targetUid,
      role,
    }),
  );
  return updated;
}

/**
 * Sets a user's Firebase Auth password to ADMIN_RESET_PASSWORD (admin demo tool).
 * @param {string} actorUid
 * @param {string} targetUid
 */
export async function resetUserPassword(actorUid, targetUid) {
  const target = await usersRepository.getUserById(targetUid);
  if (!target) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  try {
    await adminAuth.updateUser(targetUid, { password: env.ADMIN_RESET_PASSWORD });
  } catch (err) {
    const code = /** @type {{ code?: string }} */ (err).code;
    if (code === 'auth/user-not-found') {
      throw new AppError(
        404,
        'AUTH_USER_NOT_FOUND',
        'No Firebase Auth account for this user. They must register or be created via seed:demo first.',
      );
    }
    throw err;
  }

  console.info(
    JSON.stringify({
      action: 'admin.user.resetPassword',
      actorUid,
      targetUid,
      email: target.email,
    }),
  );

  return {
    ok: true,
    message: 'Password reset successfully',
  };
}

/**
 * @param {{ date?: string; userId?: string; status?: string; role?: 'employee' | 'admin'; q?: string; page?: number; limit?: number }} query
 */
export async function searchAttendance(query) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 10, 100);

  let rows = [];

  if (query.userId) {
    if (query.date) {
      const one = await attendanceRepository.getById(query.userId, query.date);
      rows = one ? [one] : [];
    } else {
      const user = await usersRepository.getUserById(query.userId);
      if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      }
      const to = getWorkDateForTimezone(new Date(), user.timezone);
      const from = subtractDays(to, 30);
      rows = await attendanceRepository.queryByUserAndDateRange(query.userId, from, to);
    }
  } else if (query.date) {
    rows = await attendanceRepository.queryByDate(query.date);
  }

  if (query.status) {
    rows = rows.filter((row) => row.status === query.status);
  }

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const users = await usersRepository.getUsersByIds(userIds);
  const userMap = new Map(users.map((u) => [u.uid, u]));

  let items = rows.map((attendance) => {
    const user = userMap.get(attendance.userId) ?? {
      fullName: 'Unknown',
      email: '',
    };
    return enrichAttendanceRow(attendance, user);
  });

  if (query.q) {
    items = filterByQuery(items, query.q);
  }

  if (query.role) {
    items = items.filter((item) => userMap.get(item.attendance.userId)?.role === query.role);
  }

  items.sort((a, b) => a.fullName.localeCompare(b.fullName));

  return paginate(items, page, limit);
}

/**
 * @param {string} adminUid
 * @param {{ userId: string; date: string; timeIn: string; timeOut: string; reason: string }} body
 */
export async function createAttendance(adminUid, body) {
  const user = await usersRepository.getUserById(body.userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const timeIn = new Date(body.timeIn);
  const timeOut = new Date(body.timeOut);
  assertWorkDateMatchesTimeIn(body.date, timeIn, user.timezone);

  const existing = await attendanceRepository.getById(body.userId, body.date);
  if (existing) {
    throw new AppError(409, 'ATTENDANCE_ALREADY_EXISTS', 'Attendance already exists for this date');
  }

  const metrics = calculateAttendanceMetrics({
    date: body.date,
    timeIn,
    timeOut,
    schedule: user.schedule,
    timezone: user.timezone,
  });

  const { attendance, dailySummary } = await attendanceWriteRepository.closeAttendanceWithSummary(
    body.userId,
    body.date,
    { timeIn, timeOut, ...metrics },
    metricsToSummaryPayload(metrics),
    buildCorrectionMeta(adminUid, body.reason),
  );

  console.info(
    JSON.stringify({
      action: 'admin.attendance.create',
      adminUid,
      userId: body.userId,
      date: body.date,
      reason: body.reason,
    }),
  );

  return { attendance, dailySummary };
}

/**
 * @param {string} adminUid
 * @param {string} userId
 * @param {string} date
 * @param {{ timeIn: string; timeOut: string; reason: string }} body
 */
export async function patchAttendance(adminUid, userId, date, body) {
  const user = await usersRepository.getUserById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const existing = await attendanceRepository.getById(userId, date);
  if (!existing) {
    throw new AppError(404, 'ATTENDANCE_NOT_FOUND', 'Attendance not found');
  }

  const timeIn = new Date(body.timeIn);
  const timeOut = new Date(body.timeOut);
  assertWorkDateMatchesTimeIn(date, timeIn, user.timezone);

  const metrics = calculateAttendanceMetrics({
    date,
    timeIn,
    timeOut,
    schedule: user.schedule,
    timezone: user.timezone,
  });

  const { attendance, dailySummary } = await attendanceWriteRepository.closeAttendanceWithSummary(
    userId,
    date,
    { timeIn, timeOut, ...metrics },
    metricsToSummaryPayload(metrics),
    buildCorrectionMeta(adminUid, body.reason),
  );

  console.info(
    JSON.stringify({
      action: 'admin.attendance.patch',
      adminUid,
      userId,
      date,
      reason: body.reason,
    }),
  );

  return { attendance, dailySummary };
}

/**
 * @param {string} adminUid
 * @param {string} userId
 * @param {string} date
 * @param {{ reason: string }} body
 */
export async function deleteAttendance(adminUid, userId, date, body) {
  const user = await usersRepository.getUserById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const existing = await attendanceRepository.getById(userId, date);
  if (!existing) {
    throw new AppError(404, 'ATTENDANCE_NOT_FOUND', 'Attendance not found');
  }

  await attendanceWriteRepository.deleteAttendanceWithSummary(userId, date);

  console.info(
    JSON.stringify({
      action: 'admin.attendance.delete',
      adminUid,
      userId,
      date,
      reason: body.reason,
      deletedTimeIn: existing.timeIn,
      deletedTimeOut: existing.timeOut,
    }),
  );

  return { ok: true };
}

/**
 * @param {string} date YYYY-MM-DD
 */
function assertValidDashboardDate(date) {
  if (!parseDateString(date)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
  }
}

/**
 * @param {string} date
 */
async function loadEmployeeDayContext(date) {
  const [employees, attendances] = await Promise.all([
    usersRepository.listUsers({ role: 'employee', limit: MAX_EMPLOYEE_LIST }),
    attendanceRepository.queryByDate(date),
  ]);
  return { employees, attendances };
}

/**
 * @param {object[]} employees
 * @param {object[]} attendances
 */
function buildTodayRoster(employees, attendances) {
  const byUser = new Map(attendances.map((a) => [a.userId, a]));

  return employees.map((user) => {
    const attendance = byUser.get(user.uid);
    return {
      userId: user.uid,
      fullName: user.fullName,
      email: user.email,
      status: attendance ? attendance.status : 'absent',
      attendance: attendance ?? null,
    };
  });
}

/**
 * @param {string} date
 * @param {object[]} employees
 * @param {object[]} attendances
 * @param {object[]} summaries
 */
function buildDashboardKpis(date, employees, attendances, summaries) {
  const punchedInNow = attendances.filter((a) => a.status === 'open').length;
  const employeeIdsWithAttendance = new Set(attendances.map((a) => a.userId));
  const absentToday = employees.filter((e) => !employeeIdsWithAttendance.has(e.uid)).length;
  const totals = aggregateTotals(summaries);

  return {
    date,
    activeEmployees: employees.length,
    punchedInNow,
    absentToday,
    totalOvertimeHours: totals.totalOvertimeHours,
    totalLateMinutes: totals.totalLateMinutes,
  };
}

/**
 * @param {string} date YYYY-MM-DD
 */
export async function getDashboardKpis(date) {
  assertValidDashboardDate(date);
  const { employees, attendances } = await loadEmployeeDayContext(date);
  const summaries = await dailySummaryRepository.queryByDate(date);
  return buildDashboardKpis(date, employees, attendances, summaries);
}

/**
 * Merges all employees with attendance for a date (dashboard roster).
 * @param {string} date
 */
export async function getTodayRoster(date) {
  assertValidDashboardDate(date);
  const { employees, attendances } = await loadEmployeeDayContext(date);
  return buildTodayRoster(employees, attendances);
}

/**
 * KPIs and roster with a single employee list + attendance query.
 * @param {string} date
 */
export async function getDayOverview(date) {
  assertValidDashboardDate(date);
  const { employees, attendances } = await loadEmployeeDayContext(date);
  const summaries = await dailySummaryRepository.queryByDate(date);

  return {
    kpis: buildDashboardKpis(date, employees, attendances, summaries),
    roster: buildTodayRoster(employees, attendances),
  };
}
