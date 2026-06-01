import { formatDateLabel, formatHours, formatMinutes } from '../../utils/format.js';
import { DataTable } from '../ui/DataTable.jsx';

/**
 * @param {{
 *   items: Array<{
 *     date: string;
 *     totalRegularHours?: number;
 *     totalOvertimeHours?: number;
 *     totalNightDifferentialHours?: number;
 *     totalLateMinutes?: number;
 *     totalUndertimeMinutes?: number;
 *     fullName?: string;
 *   }>;
 *   showEmployee?: boolean;
 *   loading?: boolean;
 *   emptyMessage?: string;
 * }} props
 */
export function SummaryTable({
  items,
  showEmployee = false,
  loading = false,
  emptyMessage = 'No summary records for this period.',
}) {
  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <span className="font-medium text-slate-900">{formatDateLabel(row.date)}</span>
      ),
    },
  ];

  if (showEmployee) {
    columns.push({
      key: 'fullName',
      label: 'Employee',
      render: (row) => row.fullName ?? '—',
    });
  }

  columns.push(
    {
      key: 'regular',
      label: 'Regular',
      align: 'right',
      render: (row) => formatHours(row.totalRegularHours),
    },
    {
      key: 'ot',
      label: 'OT',
      align: 'right',
      render: (row) => formatHours(row.totalOvertimeHours),
    },
    {
      key: 'nd',
      label: 'ND',
      align: 'right',
      render: (row) => formatHours(row.totalNightDifferentialHours),
    },
    {
      key: 'late',
      label: 'Late',
      align: 'right',
      render: (row) => formatMinutes(row.totalLateMinutes),
    },
    {
      key: 'undertime',
      label: 'Undertime',
      align: 'right',
      render: (row) => formatMinutes(row.totalUndertimeMinutes),
    },
  );

  return (
    <DataTable
      columns={columns}
      rows={items}
      rowKey={(row) => `${row.userId ?? ''}_${row.date}`}
      loading={loading}
      emptyTitle="No summaries"
      emptyMessage={emptyMessage}
      caption="Summary records"
    />
  );
}
