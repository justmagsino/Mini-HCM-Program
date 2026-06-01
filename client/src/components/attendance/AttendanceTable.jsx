import { formatDateLabel, formatHours, formatMinutes, formatStatus, formatTime } from '../../utils/format.js';
import { DataTable } from '../ui/DataTable.jsx';
import { AttendanceStatusBadge } from './AttendanceStatusBadge.jsx';
import { TardinessTags } from './TardinessTags.jsx';

/**
 * @param {{
 *   items: Array<object>;
 *   timezone: string;
 *   loading?: boolean;
 * }} props
 */
export function AttendanceTable({ items, timezone, loading = false }) {
  return (
    <DataTable
      loading={loading}
      emptyTitle="No attendance records"
      emptyMessage="No attendance records for this date range."
      caption="Attendance history"
      columns={[
        {
          key: 'date',
          label: 'Date',
          render: (row) => (
            <span className="font-medium text-slate-900">{formatDateLabel(row.date)}</span>
          ),
        },
        {
          key: 'timeIn',
          label: 'Time in',
          render: (row) => formatTime(row.timeIn, timezone),
        },
        {
          key: 'timeOut',
          label: 'Time out',
          render: (row) => formatTime(row.timeOut, timezone),
        },
        {
          key: 'status',
          label: 'Status',
          render: (row) => (
            <div className="flex flex-wrap items-center gap-1.5">
              <AttendanceStatusBadge status={row.status} showAbsentLabel={false} />
              <TardinessTags
                status={row.status}
                lateMinutes={row.lateMinutes}
                undertimeMinutes={row.undertimeMinutes}
                regularHours={row.regularHours}
              />
            </div>
          ),
        },
        {
          key: 'undertime',
          label: 'Undertime',
          render: (row) => formatMinutes(row.undertimeMinutes),
        },
        {
          key: 'regular',
          label: 'Regular',
          render: (row) => formatHours(row.regularHours),
        },
        {
          key: 'ot',
          label: 'OT',
          render: (row) => formatHours(row.overtimeHours),
        },
        {
          key: 'late',
          label: 'Late',
          render: (row) => formatMinutes(row.lateMinutes),
        },
      ]}
      rows={items}
      rowKey={(row) => `${row.userId}_${row.date}`}
    />
  );
}
