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
 */
export async function getTeamDailyReport(date) {
  if (!parseDateString(date)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
  }

  const summaries = await dailySummaryRepository.queryByDate(date);
  const userIds = summaries.map((s) => s.userId);
  const users = await usersRepository.getUsersByIds(userIds);
  const userMap = new Map(users.map((u) => [u.uid, u]));

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
 * @param {{ page?: number; limit?: number }} pagination
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
  const limit = Math.min(pagination.limit ?? 20, 100);

  // Include all profiles (employee + admin) so small teams and solo-admin setups still appear in reports.
  const employees = await usersRepository.listUsers({ limit: MAX_EMPLOYEE_LIST });
  const total = employees.length;
  const start = (page - 1) * limit;
  const pageEmployees = employees.slice(start, start + limit);

  const weekDates = listDateStringsInclusive(weekStart, weekEnd);
  const pageSummaryIds = pageEmployees.flatMap((user) =>
    weekDates.map((d) => buildDailySummaryId(user.uid, d)),
  );
  const pageSummaries = await dailySummaryRepository.getByIds(pageSummaryIds);
  const byUser = groupSummariesByUserId(pageSummaries);

  const allWeekSummaries = await dailySummaryRepository.queryByDateRange(weekStart, weekEnd);

  const items = pageEmployees.map((user) => {
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
    totals: aggregateTotals(allWeekSummaries),
  };
}

/**
 * Late / undertime exceptions from dailySummary in range.
 * @param {string} from
 * @param {string} to
 */
export async function getExceptionsReport(from, to) {
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

  const items = flagged
    .map((row) => ({
      userId: row.userId,
      fullName: userMap.get(row.userId)?.fullName ?? 'Unknown',
      date: row.date,
      totalLateMinutes: row.totalLateMinutes,
      totalUndertimeMinutes: row.totalUndertimeMinutes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.fullName.localeCompare(b.fullName));

  return { items, from: range.from, to: range.to };
}
