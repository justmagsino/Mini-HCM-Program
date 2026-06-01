/**
 * Maps computation engine output to dailySummary document fields.
 * @param {{
 *   regularHours: number;
 *   overtimeHours: number;
 *   nightDifferentialHours: number;
 *   lateMinutes: number;
 *   undertimeMinutes: number;
 * }} metrics
 */
export function metricsToSummaryPayload(metrics) {
  return {
    totalRegularHours: metrics.regularHours,
    totalOvertimeHours: metrics.overtimeHours,
    totalNightDifferentialHours: metrics.nightDifferentialHours,
    totalLateMinutes: metrics.lateMinutes,
    totalUndertimeMinutes: metrics.undertimeMinutes,
  };
}
