import { formatDateLabel, formatHours, formatMinutes, formatStatus, formatTime } from '../../utils/format.js';
import { DataTable } from '../ui/DataTable.jsx';
import { AttendanceStatusBadge } from './AttendanceStatusBadge.jsx';

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
          render: (row) => <AttendanceStatusBadge status={row.status} showAbsentLabel={false} />,
        },
        {
          key: 'regular',
          label: 'Regular',
          align: 'right',
          render: (row) => formatHours(row.regularHours),
        },
        {
          key: 'ot',
          label: 'OT',
          align: 'right',
          render: (row) => formatHours(row.overtimeHours),
        },
        {
          key: 'late',
          label: 'Late',
          align: 'right',
          render: (row) => formatMinutes(row.lateMinutes),
        },
      ]}
      rows={items}
      rowKey={(row) => `${row.userId}_${row.date}`}
    />
  );
}
