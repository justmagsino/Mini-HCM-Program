import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import {
  assertValidHistoryRange,
  buildDailySummaryId,
  getWeekEnd,
  isMonday,
  listDateStringsInclusive,
  MAX_EMPLOYEE_LIST,
  parseDateString,
} from '../utils/dates.js';
import { filterByQuery } from '../utils/adminHelpers.js';
import {
  aggregateTotals,
  buildWeeklyDays,
  groupSummariesByUserId,
} from '../utils/summaryAggregate.js';
import * as dailySummaryRepository from '../repositories/dailySummary.repository.js';
import * as usersRepository from '../repositories/users.repository.js';

/**
 * @param {string} date YYYY-MM-DD
 */
export async function getAdminDailySummary(userId, date) {
  if (!parseDateString(date)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
  }

  const user = await usersRepository.getUserById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const data = await dailySummaryRepository.getByUserAndDate(userId, date);
  return data;
}

/**
 * Team daily report: one Firestore query by date, joined with users.
 * @param {string} date YYYY-MM-DD
 * @param {'employee' | 'admin'} [role]
 */
export async function getTeamDailyReport(date, role) {
  if (!parseDateString(date)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
  }

  let summaries = await dailySummaryRepository.queryByDate(date);
  const userIds = summaries.map((s) => s.userId);
  const users = await usersRepository.getUsersByIds(userIds);
  const userMap = new Map(users.map((u) => [u.uid, u]));

  if (role) {
    summaries = summaries.filter((s) => userMap.get(s.userId)?.role === role);
  }

  const items = summaries
    .map((summary) => {
      const user = userMap.get(summary.userId);
      return {
        ...summary,
        fullName: user?.fullName ?? 'Unknown',
        email: user?.email ?? '',
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return { date, items, totals: aggregateTotals(summaries) };
}

/**
 * Team weekly report: single range query, grouped per employee with pagination.
 * @param {string} weekStart Monday YYYY-MM-DD
 * @param {string} timezone
 * @param {{ page?: number; limit?: number; q?: string; role?: 'employee' | 'admin' }} pagination
 */
export async function getTeamWeeklyReport(weekStart, timezone, pagination = {}) {
  if (!parseDateString(weekStart)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'weekStart must be YYYY-MM-DD');
  }

  if (!isMonday(weekStart, timezone)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'weekStart must be a Monday');
  }

  const weekEnd = getWeekEnd(weekStart);
  const page = pagination.page ?? 1;
  const limit = Math.min(pagination.limit ?? 10, 100);

  const listOptions = { limit: MAX_EMPLOYEE_LIST };
  if (pagination.role) {
    listOptions.role = pagination.role;
  }

  let users = await usersRepository.listUsers(listOptions);
  users = filterByQuery(users, pagination.q);
  const total = users.length;
  const start = (page - 1) * limit;
  const pageUsers = users.slice(start, start + limit);
  const allowedUserIds = new Set(users.map((u) => u.uid));

  const weekDates = listDateStringsInclusive(weekStart, weekEnd);
  const pageSummaryIds = pageUsers.flatMap((user) =>
    weekDates.map((d) => buildDailySummaryId(user.uid, d)),
  );
  const pageSummaries = await dailySummaryRepository.getByIds(pageSummaryIds);
  const byUser = groupSummariesByUserId(pageSummaries);

  const allWeekSummaries = await dailySummaryRepository.queryByDateRange(weekStart, weekEnd);
  const totalsSummaries = allWeekSummaries.filter((s) => allowedUserIds.has(s.userId));

  const items = pageUsers.map((user) => {
    const userSummaries = byUser.get(user.uid) ?? [];
    const days = buildWeeklyDays(weekStart, user.uid, userSummaries);
    const totals = aggregateTotals(userSummaries);

    return {
      userId: user.uid,
      fullName: user.fullName,
      email: user.email,
      weekStart,
      weekEnd,
      days,
      totals,
    };
  });

  return {
    weekStart,
    weekEnd,
    items,
    page,
    limit,
    total,
    totals: aggregateTotals(totalsSummaries),
  };
}

/**
 * Late / undertime exceptions from dailySummary in range.
 * @param {string} from
 * @param {string} to
 * @param {'employee' | 'admin'} [role]
 */
export async function getExceptionsReport(from, to, role) {
  const range = assertValidHistoryRange(from, to);
  if (!range.ok) {
    const code = range.message.includes('exceed') ? 'RANGE_TOO_LARGE' : 'VALIDATION_ERROR';
    throw new AppError(400, code, range.message);
  }

  const summaries = await dailySummaryRepository.queryByDateRange(range.from, range.to);
  const flagged = summaries.filter(
    (s) =>
      s.totalLateMinutes >= env.LATE_ALERT_MINUTES ||
      s.totalUndertimeMinutes >= env.UNDERTIME_ALERT_MINUTES,
  );

  const users = await usersRepository.getUsersByIds(flagged.map((s) => s.userId));
  const userMap = new Map(users.map((u) => [u.uid, u]));

  let items = flagged
    .map((row) => ({
      userId: row.userId,
      fullName: userMap.get(row.userId)?.fullName ?? 'Unknown',
      date: row.date,
      totalLateMinutes: row.totalLateMinutes,
      totalUndertimeMinutes: row.totalUndertimeMinutes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.fullName.localeCompare(b.fullName));

  if (role) {
    items = items.filter((row) => userMap.get(row.userId)?.role === role);
  }

  return { items, from: range.from, to: range.to };
}

/**
 * Daily summary rows for Excel export (inclusive date range).
 * @param {string} from
 * @param {string} to
 * @param {'employee' | 'admin'} [role]
 */
export async function getAttendanceExportReport(from, to, role) {
  const range = assertValidHistoryRange(from, to);
  if (!range.ok) {
    const code = range.message.includes('exceed') ? 'RANGE_TOO_LARGE' : 'VALIDATION_ERROR';
    throw new AppError(400, code, range.message);
  }

  const summaries = await dailySummaryRepository.queryByDateRange(range.from, range.to);
  const userIds = [...new Set(summaries.map((s) => s.userId))];
  const users = await usersRepository.getUsersByIds(userIds);
  const userMap = new Map(users.map((u) => [u.uid, u]));

  let items = summaries.map((summary) => {
    const user = userMap.get(summary.userId);
    return {
      date: summary.date,
      userId: summary.userId,
      fullName: user?.fullName ?? 'Unknown',
      email: user?.email ?? '',
      role: user?.role ?? '',
      totalRegularHours: summary.totalRegularHours,
      totalOvertimeHours: summary.totalOvertimeHours,
      totalNightDifferentialHours: summary.totalNightDifferentialHours,
      totalLateMinutes: summary.totalLateMinutes,
      totalUndertimeMinutes: summary.totalUndertimeMinutes,
    };
  });

  if (role) {
    items = items.filter((row) => row.role === role);
  }

  items.sort(
    (a, b) => a.date.localeCompare(b.date) || a.fullName.localeCompare(b.fullName),
  );

  return { from: range.from, to: range.to, items };
}
