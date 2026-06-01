/**
 * IANA timezone helpers aligned with server/src/utils/dates.js (zonedTimeToUtc).
 */

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
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} timeHHmm HH:mm
 * @param {string} timezone
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
