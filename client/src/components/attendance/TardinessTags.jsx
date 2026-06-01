import { LATE_ALERT_MINUTES, UNDERTIME_ALERT_MINUTES } from '../../constants/tardiness.js';

/**
 * Undertime in data = minutes left before scheduled shift end (not “missing hours” in general).
 * Also flag when no regular hours were earned but late applies (e.g. punch in/out with no real work).
 *
 * @param {{
 *   lateMinutes?: number | null;
 *   undertimeMinutes?: number | null;
 *   regularHours?: number | null;
 *   status?: string;
 * }} props
 */
export function TardinessTags({ lateMinutes, undertimeMinutes, regularHours, status }) {
  if (status !== 'closed') {
    return null;
  }

  const late = lateMinutes ?? 0;
  const undertime = undertimeMinutes ?? 0;
  const regular = regularHours ?? 0;
  const showLate = late >= LATE_ALERT_MINUTES;
  const showUndertime =
    undertime >= UNDERTIME_ALERT_MINUTES ||
    (regular === 0 && late >= LATE_ALERT_MINUTES);

  if (!showLate && !showUndertime) {
    return null;
  }

  return (
    <>
      {showLate && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
          Late
        </span>
      )}
      {showUndertime && (
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-900">
          Undertime
        </span>
      )}
    </>
  );
}
