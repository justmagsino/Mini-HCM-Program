/**
 * @param {string | null | undefined} iso
 * @param {string} timezone IANA
 */
export function formatTime(iso, timezone) {
  if (!iso) {
    return '—';
  }

  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

/**
 * @param {string} dateStr YYYY-MM-DD
 */
export function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * @param {number | null | undefined} hours
 */
export function formatHours(hours) {
  if (hours == null) {
    return '—';
  }
  return `${Number(hours).toFixed(2)}h`;
}

/**
 * @param {number | null | undefined} minutes
 */
export function formatMinutes(minutes) {
  if (minutes == null) {
    return '—';
  }
  return `${minutes}m`;
}

/**
 * @param {'open' | 'closed'} status
 */
export function formatStatus(status) {
  if (status === 'open') {
    return 'Open';
  }
  if (status === 'closed') {
    return 'Closed';
  }
  return status ?? '—';
}
