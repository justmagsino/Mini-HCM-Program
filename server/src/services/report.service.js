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
 * Team range report: aggregate dailySummary per employee between from and to (inclusive).
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 * @param {{ page?: number; limit?: number; q?: string; role?: 'employee' | 'admin' }} pagination
 */
export async function getTeamRangeReport(from, to, pagination = {}) {
  const range = assertValidHistoryRange(from, to);
  if (!range.ok) {
    const code = range.message.includes('exceed') ? 'RANGE_TOO_LARGE' : 'VALIDATION_ERROR';
    throw new AppError(400, code, range.message);
  }

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

  const rangeSummaries = await dailySummaryRepository.queryByDateRange(range.from, range.to);
  const byUser = groupSummariesByUserId(rangeSummaries);

  const totalsSummaries = rangeSummaries.filter((s) => allowedUserIds.has(s.userId));

  const items = pageUsers.map((user) => {
    const userSummaries = byUser.get(user.uid) ?? [];
    return {
      userId: user.uid,
      fullName: user.fullName,
      email: user.email,
      daysWithSummary: userSummaries.length,
      totals: aggregateTotals(userSummaries),
    };
  });

  return {
    from: range.from,
    to: range.to,
    items,
    page,
    limit,
    total,
    totals: aggregateTotals(totalsSummaries),
  };
}
