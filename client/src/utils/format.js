/**
 * @param {string | null | undefined} iso
 * @param {string} timezone IANA
 */
export function formatTime(iso, timezone) {
  if (!iso) {
    return '—';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
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
 * @param {'employee' | 'admin' | string | null | undefined} role
 */
export function formatUserRole(role) {
  if (role === 'employee') {
    return 'Employee';
  }
  if (role === 'admin') {
    return 'Admin';
  }
  return role ?? '—';
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
