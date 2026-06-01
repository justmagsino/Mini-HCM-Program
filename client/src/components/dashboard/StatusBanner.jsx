import { Link } from 'react-router-dom';
import { formatTime } from '../../utils/format.js';

/**
 * @param {{
 *   attendance: object | null;
 *   timezone: string;
 * }} props
 */
export function StatusBanner({ attendance, timezone }) {
  if (!attendance) {
    return (
      <div className="card border-slate-200" role="status">
        <div className="card-body">
          <p className="text-sm text-slate-600">You have not punched in today.</p>
          <Link to="/attendance" className="link-primary mt-3 inline-block text-sm">
            Go to attendance →
          </Link>
        </div>
      </div>
    );
  }

  if (attendance.status === 'open') {
    return (
      <div className="card border-green-200 bg-green-50" role="status">
        <div className="card-body">
          <p className="font-medium text-green-900">Currently punched in</p>
          <p className="mt-1 text-sm text-green-800">
            Since {formatTime(attendance.timeIn, timezone)} · {attendance.date}
          </p>
          <Link to="/attendance" className="link-primary mt-3 inline-block text-sm text-green-900">
            Punch out →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card" role="status">
      <div className="card-body">
        <p className="font-medium text-slate-900">Today&apos;s session is closed</p>
        <p className="mt-1 text-sm text-slate-600">
          In {formatTime(attendance.timeIn, timezone)} · Out{' '}
          {formatTime(attendance.timeOut, timezone)}
        </p>
      </div>
    </div>
  );
}
