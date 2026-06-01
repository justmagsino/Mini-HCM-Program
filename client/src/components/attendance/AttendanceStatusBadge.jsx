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

/**
 * @param {{ status: string; showAbsentLabel?: boolean }}
 */
export function AttendanceStatusBadge({ status, showAbsentLabel = true }) {
  const label =
    status === 'absent' && showAbsentLabel
      ? STATUS_LABELS.absent
      : (STATUS_LABELS[status] ?? status);

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700'}`}
    >
      {label}
    </span>
  );
}
