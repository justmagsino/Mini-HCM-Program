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
 * @param {string} dateStr YYYY-MM-DD
 */
export function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * @param {number | null | undefined} hours Decimal hours
 */
export function formatHoursMinutes(hours) {
  if (hours == null) {
    return '—';
  }

  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * @param {string | null | undefined} timeIn ISO
 * @param {string | null | undefined} timeOut ISO
 */
export function formatWorkedDuration(timeIn, timeOut) {
  if (!timeIn || !timeOut) {
    return '—';
  }

  const start = new Date(timeIn).getTime();
  const end = new Date(timeOut).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return '—';
  }

  const totalMinutes = Math.floor((end - start) / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
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
