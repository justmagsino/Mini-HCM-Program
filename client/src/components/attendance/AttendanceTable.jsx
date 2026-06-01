import {
  formatDateLabel,
  formatHoursMinutes,
  formatMinutes,
  formatTime,
  formatWorkedDuration,
} from '../../utils/format.js';
import { DataTable } from '../ui/DataTable.jsx';
import { TablePaginationFooter } from '../ui/TablePaginationFooter.jsx';
import { AttendanceStatusBadge } from './AttendanceStatusBadge.jsx';

/**
 * @param {{
 *   items: Array<object>;
 *   timezone: string;
 *   loading?: boolean;
 *   page?: number;
 *   limit?: number;
 *   total?: number;
 *   onPageChange?: (page: number) => void;
 * }} props
 */
export function AttendanceTable({
  items,
  timezone,
  loading = false,
  page = 1,
  limit = 10,
  total = 0,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showPagination = Boolean(onPageChange) && total > 0;

  return (
    <DataTable
      loading={loading}
      minRows={showPagination ? limit : 0}
      footer={
        showPagination ? (
          <TablePaginationFooter
            pageRowCount={items.length}
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            loading={loading}
            ariaLabel="Attendance history pagination"
          />
        ) : null
      }
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
          label: 'Time In',
          align: 'center',
          render: (row) => formatTime(row.timeIn, timezone),
        },
        {
          key: 'timeOut',
          label: 'Time Out',
          align: 'center',
          render: (row) => formatTime(row.timeOut, timezone),
        },
        {
          key: 'worked',
          label: 'Worked',
          align: 'center',
          render: (row) => formatWorkedDuration(row.timeIn, row.timeOut),
        },
        {
          key: 'late',
          label: 'Late',
          align: 'center',
          render: (row) => formatMinutes(row.lateMinutes),
        },
        {
          key: 'undertime',
          label: 'Undertime',
          align: 'center',
          render: (row) => formatMinutes(row.undertimeMinutes),
        },
        {
          key: 'ot',
          label: 'OT',
          align: 'center',
          render: (row) => formatHoursMinutes(row.overtimeHours),
        },
        {
          key: 'status',
          label: 'Status',
          align: 'center',
          render: (row) => (
            <div className="flex justify-center">
              <AttendanceStatusBadge status={row.status} showAbsentLabel={false} variant="history" />
            </div>
          ),
        },
      ]}
      rows={items}
      rowKey={(row) => `${row.userId}_${row.date}`}
    />
  );
}
