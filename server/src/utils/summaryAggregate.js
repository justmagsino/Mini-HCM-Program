import { addDaysToDateString, getWeekEnd } from './dates.js';

export { getWeekEnd };

/** @typedef {import('../repositories/dailySummary.repository.js').mapDailySummaryDocToDto extends Function ? object : object} DailySummaryDto */

export const ZERO_TOTALS = {
  totalRegularHours: 0,
  totalOvertimeHours: 0,
  totalNightDifferentialHours: 0,
  totalLateMinutes: 0,
  totalUndertimeMinutes: 0,
};

/**
 * @param {string} date YYYY-MM-DD
 * @param {string} [userId]
 */
export function emptyDaySummary(date, userId) {
  return {
    ...(userId ? { userId } : {}),
    date,
    ...ZERO_TOTALS,
  };
}

/**
 * @param {Array<{
 *   totalRegularHours?: number;
 *   totalOvertimeHours?: number;
 *   totalNightDifferentialHours?: number;
 *   totalLateMinutes?: number;
 *   totalUndertimeMinutes?: number;
 * }>} summaries
 */
export function aggregateTotals(summaries) {
  const totals = { ...ZERO_TOTALS };

  for (const row of summaries) {
    totals.totalRegularHours += row.totalRegularHours ?? 0;
    totals.totalOvertimeHours += row.totalOvertimeHours ?? 0;
    totals.totalNightDifferentialHours += row.totalNightDifferentialHours ?? 0;
    totals.totalLateMinutes += row.totalLateMinutes ?? 0;
    totals.totalUndertimeMinutes += row.totalUndertimeMinutes ?? 0;
  }

  totals.totalRegularHours = round2(totals.totalRegularHours);
  totals.totalOvertimeHours = round2(totals.totalOvertimeHours);
  totals.totalNightDifferentialHours = round2(totals.totalNightDifferentialHours);

  return totals;
}

/**
 * @param {string} weekStart
 * @returns {string[]}
 */
export function buildWeekDates(weekStart) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDaysToDateString(weekStart, i));
  }
  return dates;
}

/**
 * Builds 7 day slots; missing summaries become zero-filled day objects.
 * @param {string} weekStart
 * @param {string} userId
 * @param {DailySummaryDto[]} summaries
 */
export function buildWeeklyDays(weekStart, userId, summaries) {
  const byDate = new Map(summaries.map((s) => [s.date, s]));
  const dates = buildWeekDates(weekStart);

  return dates.map((date) => {
    const existing = byDate.get(date);
    if (existing) {
      return { ...existing };
    }
    return emptyDaySummary(date, userId);
  });
}

/**
 * @param {DailySummaryDto[]} summaries
 */
export function groupSummariesByUserId(summaries) {
  /** @type {Map<string, DailySummaryDto[]>} */
  const map = new Map();

  for (const row of summaries) {
    const list = map.get(row.userId) ?? [];
    list.push(row);
    map.set(row.userId, list);
  }

  return map;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
