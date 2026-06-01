const STATUS_STYLES = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-slate-100 text-slate-700',
  absent: 'bg-amber-100 text-amber-800',
};

const STATUS_LABELS = {
  open: 'In',
  closed: 'Out',
  absent: 'Absent',
};

const HISTORY_STATUS_LABELS = {
  open: 'In',
  closed: 'Present',
  absent: 'Absent',
};

/**
 * @param {{ status: string; showAbsentLabel?: boolean; variant?: 'default' | 'history' }}
 */
export function AttendanceStatusBadge({
  status,
  showAbsentLabel = true,
  variant = 'default',
}) {
  const labels = variant === 'history' ? HISTORY_STATUS_LABELS : STATUS_LABELS;
  const label =
    status === 'absent' && showAbsentLabel
      ? labels.absent
      : (labels[status] ?? status);

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700'}`}
    >
      {label}
    </span>
  );
}
