import { addDaysToDateString } from './dates.js';

/**
 * Aggregates team overtime hours per day for the admin dashboard chart.
 * @param {Array<{ days?: Array<{ date: string; totalOvertimeHours?: number }> }>} items
 * @param {string} weekStart YYYY-MM-DD Monday
 */
export function buildTeamOvertimeByDay(items, weekStart) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDaysToDateString(weekStart, i));
  }

  return dates.map((date) => {
    let overtime = 0;
    for (const employee of items) {
      const day = employee.days?.find((d) => d.date === date);
      overtime += day?.totalOvertimeHours ?? 0;
    }
    const label = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
    });
    return { date, label, overtime: Math.round(overtime * 100) / 100 };
  });
}
