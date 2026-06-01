/**
 * Computation checklist — maps QA requirements to engine outputs (07-computation-engine).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAttendanceMetrics,
  computeLateMinutes,
  computeNightDifferentialMinutes,
  computeOvertimeMinutes,
  computeUndertimeMinutes,
} from '../engines/computation.engine.js';
import { zonedTimeToUtc } from '../utils/dates.js';

const TZ = 'Asia/Manila';
const SCHEDULE = { start: '09:00', end: '18:00' };
const DATE = '2026-06-10';

function at(dateStr, timeHHmm) {
  return zonedTimeToUtc(dateStr, timeHHmm, TZ);
}

function metrics(timeInHHmm, timeOutHHmm, date = DATE) {
  return computeAttendanceMetrics({
    date,
    timeIn: at(date, timeInHHmm),
    timeOut: at(date, timeOutHHmm),
    schedule: SCHEDULE,
    timezone: TZ,
  });
}

describe('COMPUTATION checklist', () => {
  it('overtime calculation correct', () => {
    const m = metrics('09:00', '19:00');
    assert.equal(m.overtimeHours, 1);
    assert.equal(m.regularHours, 9);
    const shiftEnd = at(DATE, '18:00');
    assert.equal(
      computeOvertimeMinutes(at(DATE, '09:00'), at(DATE, '19:00'), shiftEnd),
      60,
    );
    console.log('✓ PASS: overtime calculation correct');
  });

  it('late detection correct', () => {
    const m = metrics('09:20', '18:00');
    assert.equal(m.lateMinutes, 20);
    assert.equal(
      computeLateMinutes(at(DATE, '09:20'), at(DATE, '09:00')),
      20,
    );
    console.log('✓ PASS: late detection correct');
  });

  it('undertime calculation correct', () => {
    const m = metrics('09:00', '17:00');
    assert.equal(m.undertimeMinutes, 60);
    assert.equal(m.regularHours, 8);
    assert.equal(
      computeUndertimeMinutes(at(DATE, '17:00'), at(DATE, '18:00')),
      60,
    );
    console.log('✓ PASS: undertime calculation correct');
  });

  it('night differential calculation correct (22:00–06:00)', () => {
    const m = metrics('21:00', '23:00');
    assert.equal(m.nightDifferentialHours, 1);

    const crossMidnight = computeNightDifferentialMinutes(
      at(DATE, '21:00'),
      at('2026-06-11', '02:00'),
      TZ,
    );
    assert.equal(crossMidnight, 240);
    console.log('✓ PASS: night differential calculation correct');
  });
});
