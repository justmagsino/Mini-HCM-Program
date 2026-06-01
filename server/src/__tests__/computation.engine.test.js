import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAttendanceMetrics,
  computeLateMinutes,
  computeNightDifferentialMinutes,
  computeOvertimeMinutes,
  computeRegularMinutes,
  computeUndertimeMinutes,
} from '../engines/computation.engine.js';
import { buildShiftBounds, zonedTimeToUtc } from '../utils/dates.js';
import { ComputationError } from '../engines/computation.errors.js';

const TZ = 'Asia/Manila';
const SCHEDULE = { start: '09:00', end: '18:00' };

function at(dateStr, timeHHmm) {
  return zonedTimeToUtc(dateStr, timeHHmm, TZ);
}

function metrics(date, timeInHHmm, timeOutHHmm, schedule = SCHEDULE) {
  return computeAttendanceMetrics({
    date,
    timeIn: at(date, timeInHHmm),
    timeOut: at(date, timeOutHHmm),
    schedule,
    timezone: TZ,
  });
}

describe('computeAttendanceMetrics — worked examples (07)', () => {
  it('A — on time, full day', () => {
    const m = metrics('2026-06-01', '09:00', '18:00');
    assert.equal(m.lateMinutes, 0);
    assert.equal(m.undertimeMinutes, 0);
    assert.equal(m.regularHours, 9);
    assert.equal(m.overtimeHours, 0);
    assert.equal(m.nightDifferentialHours, 0);
  });

  it('B — late + OT', () => {
    const m = metrics('2026-06-01', '09:15', '19:00');
    assert.equal(m.lateMinutes, 15);
    assert.equal(m.regularHours, 8.75);
    assert.equal(m.overtimeHours, 1);
    assert.equal(m.undertimeMinutes, 0);
  });

  it('C — early departure', () => {
    const m = metrics('2026-06-01', '09:00', '17:00');
    assert.equal(m.undertimeMinutes, 60);
    assert.equal(m.regularHours, 8);
    assert.equal(m.overtimeHours, 0);
  });

  it('D — night differential', () => {
    const m = metrics('2026-06-01', '21:00', '23:00');
    assert.equal(m.nightDifferentialHours, 1);
    assert.equal(m.overtimeHours, 2);
    assert.equal(m.regularHours, 0);
  });
});

describe('cross-midnight work interval', () => {
  it('uses full timeIn→timeOut for ND across two calendar days', () => {
    const date = '2026-06-01';
    const timeIn = at(date, '21:00');
    const timeOut = at('2026-06-02', '02:00');

    const nd = computeNightDifferentialMinutes(timeIn, timeOut, TZ);
    // 22:00–24:00 (2h) + 00:00–02:00 (2h) = 4h
    assert.equal(nd, 240);
  });

  it('keeps shift bounds on punch-in date for overnight shift schedule', () => {
    const nightShift = { start: '22:00', end: '06:00' };
    const date = '2026-06-01';
    const { shiftStart, shiftEnd } = buildShiftBounds(date, nightShift, TZ);

    const timeIn = at(date, '22:00');
    const timeOut = at('2026-06-02', '06:00');

    const regular = computeRegularMinutes(timeIn, timeOut, shiftStart, shiftEnd);
    assert.equal(regular, 480);
  });
});

describe('validation', () => {
  it('rejects timeOut <= timeIn', () => {
    assert.throws(
      () =>
        computeAttendanceMetrics({
          date: '2026-06-01',
          timeIn: at('2026-06-01', '10:00'),
          timeOut: at('2026-06-01', '09:00'),
          schedule: SCHEDULE,
          timezone: TZ,
        }),
      (err) => err instanceof ComputationError && err.code === 'VALIDATION_ERROR',
    );
  });

  it('rejects missing timeOut', () => {
    assert.throws(
      () =>
        computeAttendanceMetrics({
          date: '2026-06-01',
          timeIn: at('2026-06-01', '09:00'),
          timeOut: new Date('invalid'),
          schedule: SCHEDULE,
          timezone: TZ,
        }),
      (err) => err instanceof ComputationError,
    );
  });
});

describe('metric helpers', () => {
  it('computeLateMinutes returns 0 when on time', () => {
    const shiftStart = at('2026-06-01', '09:00');
    const timeIn = at('2026-06-01', '09:00');
    assert.equal(computeLateMinutes(timeIn, shiftStart), 0);
  });

  it('computeUndertimeMinutes returns 0 when staying through shift end', () => {
    const shiftEnd = at('2026-06-01', '18:00');
    const timeOut = at('2026-06-01', '18:00');
    assert.equal(computeUndertimeMinutes(timeOut, shiftEnd), 0);
  });

  it('computeOvertimeMinutes after shift end', () => {
    const shiftEnd = at('2026-06-01', '18:00');
    const timeIn = at('2026-06-01', '09:00');
    const timeOut = at('2026-06-01', '19:00');
    assert.equal(computeOvertimeMinutes(timeIn, timeOut, shiftEnd), 60);
  });
});
