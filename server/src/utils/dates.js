export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const MAX_HISTORY_DAYS = 93;
export const MAX_EMPLOYEE_LIST = 500;

/**
 * @param {string} timezone IANA timezone identifier
 */
export function isValidIanaTimezone(timezone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

const zonedPartsFormatterCache = new Map();

/**
 * @param {string} timezone
 */
function getZonedPartsFormatter(timezone) {
  if (!zonedPartsFormatterCache.has(timezone)) {
    zonedPartsFormatterCache.set(
      timezone,
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }),
    );
  }
  return zonedPartsFormatterCache.get(timezone);
}

/**
 * @param {Date} date
 * @param {string} timezone
 */
export function getZonedParts(date, timezone) {
  const parts = getZonedPartsFormatter(timezone).formatToParts(date);
  /** @type {Record<string, string>} */
  const map = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/**
 * Converts a local date + HH:mm in an IANA timezone to a UTC instant.
 * Uses fixed-point adjustment via Intl (no third-party date libraries).
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} timeHHmm HH:mm
 * @param {string} timezone
 * @returns {Date}
 */
export function zonedTimeToUtc(dateStr, timeHHmm, timezone) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeHHmm.split(':').map(Number);

  let utc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  for (let attempt = 0; attempt < 12; attempt++) {
    const parts = getZonedParts(new Date(utc), timezone);

    if (
      parts.year === year &&
      parts.month === month &&
      parts.day === day &&
      parts.hour === hour &&
      parts.minute === minute
    ) {
      return new Date(utc);
    }

    const desired = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const actual = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
    utc += desired - actual;
  }

  return new Date(utc);
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @param {number} days
 * @returns {string}
 */
export function addDaysToDateString(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Inclusive list of YYYY-MM-DD strings from `from` through `to`.
 * @param {string} from
 * @param {string} to
 */
export function listDateStringsInclusive(from, to) {
  const dates = [];
  let current = from;

  while (current <= to) {
    dates.push(current);
    current = addDaysToDateString(current, 1);
  }

  return dates;
}

/**
 * Inclusive list of YYYY-MM-DD calendar dates between two instants in a timezone.
 * @param {Date} start
 * @param {Date} end
 * @param {string} timezone
 */
export function getCalendarDatesBetween(start, end, timezone) {
  const first = getWorkDateForTimezone(start, timezone);
  const last = getWorkDateForTimezone(end, timezone);
  const dates = [];
  let current = first;

  while (current <= last) {
    dates.push(current);
    current = addDaysToDateString(current, 1);
  }

  return dates;
}

/**
 * Shift start/end on work `date` in user timezone.
 * If schedule.end <= schedule.start (clock), shift end is on the next calendar day.
 *
 * @param {string} date YYYY-MM-DD work date (punch-in date)
 * @param {{ start: string; end: string }} schedule
 * @param {string} timezone
 * @returns {{ shiftStart: Date; shiftEnd: Date }}
 */
export function buildShiftBounds(date, schedule, timezone) {
  const shiftStart = zonedTimeToUtc(date, schedule.start, timezone);
  let shiftEndDate = date;

  if (schedule.end <= schedule.start) {
    shiftEndDate = addDaysToDateString(date, 1);
  }

  const shiftEnd = zonedTimeToUtc(shiftEndDate, schedule.end, timezone);
  return { shiftStart, shiftEnd };
}

/**
 * Night differential windows for one calendar date: [22:00, 24:00) and [00:00, 06:00).
 * @param {string} date YYYY-MM-DD
 * @param {string} timezone
 * @returns {Array<{ start: Date; end: Date }>}
 */
export function buildNightDifferentialWindowsForDate(date, timezone) {
  const eveningStart = zonedTimeToUtc(date, '22:00', timezone);
  const nextDate = addDaysToDateString(date, 1);
  const eveningEnd = zonedTimeToUtc(nextDate, '00:00', timezone);
  const morningStart = zonedTimeToUtc(date, '00:00', timezone);
  const morningEnd = zonedTimeToUtc(date, '06:00', timezone);

  return [
    { start: eveningStart, end: eveningEnd },
    { start: morningStart, end: morningEnd },
  ];
}

/**
 * ND windows for every calendar day touched by [timeIn, timeOut].
 * @param {Date} timeIn
 * @param {Date} timeOut
 * @param {string} timezone
 */
export function buildNightDifferentialWindows(timeIn, timeOut, timezone) {
  const dates = getCalendarDatesBetween(timeIn, timeOut, timezone);
  const windows = [];

  for (const date of dates) {
    windows.push(...buildNightDifferentialWindowsForDate(date, timezone));
  }

  return windows;
}

/**
 * @param {string} dateStr
 * @returns {string | null}
 */
export function parseDateString(dateStr) {
  if (!DATE_REGEX.test(dateStr)) {
    return null;
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));

  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }

  return dateStr;
}

/**
 * Calendar date (YYYY-MM-DD) in the given IANA timezone.
 * @param {Date} [instant]
 * @param {string} timezone
 */
export function getWorkDateForTimezone(instant = new Date(), timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/**
 * @param {string} userId
 * @param {string} date YYYY-MM-DD
 */
export function buildAttendanceId(userId, date) {
  return `${userId}_${date}`;
}

/**
 * @param {string} userId
 * @param {string} date YYYY-MM-DD
 */
export function buildDailySummaryId(userId, date) {
  return `${userId}_${date}`;
}

/**
 * Inclusive day count between two YYYY-MM-DD strings.
 * @param {string} from
 * @param {string} to
 */
export function daysInRange(from, to) {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  return Math.floor((end - start) / 86_400_000) + 1;
}

/**
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 */
export function assertValidHistoryRange(from, to) {
  const fromDate = parseDateString(from);
  const toDate = parseDateString(to);

  if (!fromDate || !toDate) {
    return { ok: false, message: 'from and to must be YYYY-MM-DD' };
  }

  if (toDate < fromDate) {
    return { ok: false, message: 'to must be on or after from' };
  }

  const span = daysInRange(fromDate, toDate);
  if (span > MAX_HISTORY_DAYS) {
    return { ok: false, message: `Date range cannot exceed ${MAX_HISTORY_DAYS} days` };
  }

  return { ok: true, from: fromDate, to: toDate, span };
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} timezone
 */
export function isMonday(dateStr, timezone) {
  const instant = zonedTimeToUtc(dateStr, '12:00', timezone);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(instant);
  return weekday === 'Mon';
}

/**
 * Monday of the week containing `dateStr` in the given timezone.
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} timezone
 */
export function getWeekStartForDate(dateStr, timezone) {
  const instant = zonedTimeToUtc(dateStr, '12:00', timezone);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(instant);

  const offsets = { Sun: -6, Mon: 0, Tue: -1, Wed: -2, Thu: -3, Fri: -4, Sat: -5 };
  const offset = offsets[weekday] ?? 0;
  return addDaysToDateString(dateStr, offset);
}

/**
 * @param {string} timezone
 */
export function getCurrentWeekStart(timezone) {
  const today = getWorkDateForTimezone(new Date(), timezone);
  return getWeekStartForDate(today, timezone);
}

/**
 * @param {string} weekStart YYYY-MM-DD (Monday)
 * @returns {string} Sunday of that week
 */
export function getWeekEnd(weekStart) {
  return addDaysToDateString(weekStart, 6);
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @param {number} daysBack
 */
export function subtractDaysFromDateString(dateStr, daysBack) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day - daysBack));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
