/**
 * Sum regular, OT, ND, late, and undertime across summary rows (client-side).
 * @param {Array<{
 *   totalRegularHours?: number;
 *   totalOvertimeHours?: number;
 *   totalNightDifferentialHours?: number;
 *   totalLateMinutes?: number;
 *   totalUndertimeMinutes?: number;
 * }>} items
 */
export function aggregateSummaryTotals(items) {
  const totals = {
    totalRegularHours: 0,
    totalOvertimeHours: 0,
    totalNightDifferentialHours: 0,
    totalLateMinutes: 0,
    totalUndertimeMinutes: 0,
  };

  for (const row of items) {
    totals.totalRegularHours += row.totalRegularHours ?? 0;
    totals.totalOvertimeHours += row.totalOvertimeHours ?? 0;
    totals.totalNightDifferentialHours += row.totalNightDifferentialHours ?? 0;
    totals.totalLateMinutes += row.totalLateMinutes ?? 0;
    totals.totalUndertimeMinutes += row.totalUndertimeMinutes ?? 0;
  }

  totals.totalRegularHours = Math.round(totals.totalRegularHours * 100) / 100;
  totals.totalOvertimeHours = Math.round(totals.totalOvertimeHours * 100) / 100;
  totals.totalNightDifferentialHours = Math.round(totals.totalNightDifferentialHours * 100) / 100;

  return totals;
}
