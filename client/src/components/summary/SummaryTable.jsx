import { formatDateLabel, formatHours, formatMinutes } from '../../utils/format.js';
import { DataTable } from '../ui/DataTable.jsx';
import { TablePaginationFooter } from '../ui/TablePaginationFooter.jsx';

const DEFAULT_PAGE_SIZE = 10;

/**
 * @param {{
 *   items: Array<{
 *     date: string;
 *     userId?: string;
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
 *   page?: number;
 *   limit?: number;
 *   onPageChange?: (page: number) => void;
 * }} props
 */
export function SummaryTable({
  items,
  showEmployee = false,
  loading = false,
  emptyMessage = 'No summary records for this period.',
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  onPageChange,
}) {
  const total = items.length;
  const rows = onPageChange ? items.slice((page - 1) * limit, page * limit) : items;
  const totalPages = Math.max(1, Math.ceil(total / limit));
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
      align: 'center',
      render: (row) => formatHours(row.totalRegularHours),
    },
    {
      key: 'ot',
      label: 'OT',
      align: 'center',
      render: (row) => formatHours(row.totalOvertimeHours),
    },
    {
      key: 'nd',
      label: 'ND',
      align: 'center',
      render: (row) => formatHours(row.totalNightDifferentialHours),
    },
    {
      key: 'late',
      label: 'Late',
      align: 'center',
      render: (row) => formatMinutes(row.totalLateMinutes),
    },
    {
      key: 'undertime',
      label: 'Undertime',
      align: 'center',
      render: (row) => formatMinutes(row.totalUndertimeMinutes),
    },
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => `${row.userId ?? ''}_${row.date}`}
      loading={loading}
      emptyTitle="No summaries"
      emptyMessage={emptyMessage}
      caption="Summary records"
      minRows={onPageChange && total > 0 ? limit : 0}
      footer={
        onPageChange && total > 0 ? (
          <TablePaginationFooter
            pageRowCount={rows.length}
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            loading={loading}
            ariaLabel="Summary table pagination"
          />
        ) : null
      }
    />
  );
}
