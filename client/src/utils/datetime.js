import { getZonedParts, zonedTimeToUtc } from './timezone.js';

/**
 * Converts datetime-local (YYYY-MM-DDTHH:mm) in an IANA timezone to ISO UTC.
 * @param {string} datetimeLocal
 * @param {string} timezone
 */
export function toIsoFromDatetimeLocal(datetimeLocal, timezone) {
  const [dateStr, timeHHmm] = datetimeLocal.split('T');
  return zonedTimeToUtc(dateStr, timeHHmm, timezone).toISOString();
}

/**
 * Formats ISO UTC for datetime-local in the employee timezone.
 * @param {string | null | undefined} iso
 * @param {string} timezone
 */
export function toDatetimeLocalValue(iso, timezone) {
  if (!iso) {
    return '';
  }
  const parts = getZonedParts(new Date(iso), timezone);
  const pad = (n) => String(n).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}
