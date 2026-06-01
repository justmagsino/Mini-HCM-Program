import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateTotals,
  buildWeeklyDays,
  getWeekEnd,
} from '../utils/summaryAggregate.js';

describe('summaryAggregate', () => {
  it('aggregateTotals sums hours and minutes', () => {
    const totals = aggregateTotals([
      {
        totalRegularHours: 8,
        totalOvertimeHours: 1,
        totalNightDifferentialHours: 0,
        totalLateMinutes: 10,
        totalUndertimeMinutes: 0,
      },
      {
        totalRegularHours: 7.5,
        totalOvertimeHours: 0.5,
        totalNightDifferentialHours: 1,
        totalLateMinutes: 5,
        totalUndertimeMinutes: 15,
      },
    ]);

    assert.equal(totals.totalRegularHours, 15.5);
    assert.equal(totals.totalOvertimeHours, 1.5);
    assert.equal(totals.totalNightDifferentialHours, 1);
    assert.equal(totals.totalLateMinutes, 15);
    assert.equal(totals.totalUndertimeMinutes, 15);
  });

  it('buildWeeklyDays fills missing days with zeros', () => {
    const days = buildWeeklyDays('2026-06-01', 'uid1', [
      {
        userId: 'uid1',
        date: '2026-06-01',
        totalRegularHours: 8,
        totalOvertimeHours: 0,
        totalNightDifferentialHours: 0,
        totalLateMinutes: 0,
        totalUndertimeMinutes: 0,
      },
    ]);

    assert.equal(days.length, 7);
    assert.equal(days[0].totalRegularHours, 8);
    assert.equal(days[1].totalRegularHours, 0);
    assert.equal(days[6].date, getWeekEnd('2026-06-01'));
  });
});
