import { formatTime } from '../../utils/format.js';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { LoadingSpinner } from '../ui/LoadingSpinner.jsx';

/**
 * @param {{
 *   today: object | null;
 *   timezone: string;
 *   isPunchedIn: boolean;
 *   isDayClosed: boolean;
 *   actionLoading: boolean;
 *   loading?: boolean;
 *   onPunchIn: () => void;
 *   onPunchOut: () => void;
 * }} props
 */
export function PunchControls({
  today,
  timezone,
  isPunchedIn,
  isDayClosed,
  actionLoading,
  loading = false,
  onPunchIn,
  onPunchOut,
}) {
  if (loading) {
    return (
      <Card>
        <LoadingSpinner label="Loading today's attendance…" />
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="section-title">Today&apos;s attendance</h2>

      {today?.status === 'open' && (
        <p className="mt-3 text-sm text-slate-600">
          Punched in at <strong className="font-medium text-slate-900">{formatTime(today.timeIn, timezone)}</strong>
          {today.date && <span className="text-slate-500"> · {today.date}</span>}
        </p>
      )}

      {isDayClosed && (
        <p className="mt-3 text-sm text-slate-600">
          Session closed · In {formatTime(today.timeIn, timezone)} · Out{' '}
          {formatTime(today.timeOut, timezone)}
        </p>
      )}

      {!today && (
        <p className="mt-3 text-sm text-slate-500">No attendance recorded for today yet.</p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          size="lg"
          loading={actionLoading && !isPunchedIn}
          disabled={actionLoading || isPunchedIn || isDayClosed}
          onClick={onPunchIn}
          className="w-full sm:w-auto"
          aria-label="Punch in for today"
        >
          Punch In
        </Button>
        <Button
          variant="secondary"
          size="lg"
          loading={actionLoading && isPunchedIn}
          disabled={actionLoading || !isPunchedIn}
          onClick={onPunchOut}
          className="w-full sm:w-auto"
          aria-label="Punch out for today"
        >
          Punch Out
        </Button>
      </div>

      {isDayClosed && (
        <p className="mt-4 text-xs text-slate-500">
          Today&apos;s attendance is closed. Regular: {today.regularHours ?? '—'}h · OT:{' '}
          {today.overtimeHours ?? '—'}h · ND: {today.nightDifferentialHours ?? '—'}h
        </p>
      )}
    </Card>
  );
}
