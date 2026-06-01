import { AppError } from '../utils/errors.js';
import {
  assertValidHistoryRange,
  getWeekEnd,
  isMonday,
  parseDateString,
} from '../utils/dates.js';
import {
  aggregateTotals,
  buildWeeklyDays,
} from '../utils/summaryAggregate.js';
import * as dailySummaryRepository from '../repositories/dailySummary.repository.js';

/**
 * Mirrors closed attendance metrics into dailySummary (MVP).
 * @param {string} userId
 * @param {string} date YYYY-MM-DD
 * @param {{
 *   regularHours: number;
 *   overtimeHours: number;
 *   nightDifferentialHours: number;
 *   lateMinutes: number;
 *   undertimeMinutes: number;
 * }} metrics
 */
export async function syncDailySummary(userId, date, metrics) {
  return dailySummaryRepository.upsert({
    userId,
    date,
    totalRegularHours: metrics.regularHours,
    totalOvertimeHours: metrics.overtimeHours,
    totalNightDifferentialHours: metrics.nightDifferentialHours,
    totalLateMinutes: metrics.lateMinutes,
    totalUndertimeMinutes: metrics.undertimeMinutes,
  });
}

/**
 * @param {string} userId
 * @param {string} date YYYY-MM-DD
 */
export async function getDaily(userId, date) {
  if (!parseDateString(date)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
  }

  const data = await dailySummaryRepository.getByUserAndDate(userId, date);
  return data;
}

/**
 * @param {string} userId
 * @param {string} from
 * @param {string} to
 */
export async function getDailyRange(userId, from, to) {
  const range = assertValidHistoryRange(from, to);
  if (!range.ok) {
    const code = range.message.includes('exceed') ? 'RANGE_TOO_LARGE' : 'VALIDATION_ERROR';
    throw new AppError(400, code, range.message);
  }

  const items = await dailySummaryRepository.queryByUserAndDateRange(
    userId,
    range.from,
    range.to,
  );

  return { items };
}

/**
 * @param {string} userId
 * @param {string} weekStart YYYY-MM-DD (Monday)
 * @param {string} timezone
 */
export async function getWeekly(userId, weekStart, timezone) {
  if (!parseDateString(weekStart)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'weekStart must be YYYY-MM-DD');
  }

  if (!isMonday(weekStart, timezone)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'weekStart must be a Monday');
  }

  const weekEnd = getWeekEnd(weekStart);
  const summaries = await dailySummaryRepository.queryByUserAndDateRange(
    userId,
    weekStart,
    weekEnd,
  );

  const days = buildWeeklyDays(weekStart, userId, summaries);
  const totals = aggregateTotals(summaries);

  return {
    weekStart,
    weekEnd,
    days,
    totals,
  };
}
