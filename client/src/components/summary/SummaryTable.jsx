import { formatDateLabel, formatHours, formatMinutes } from '../../utils/format.js';
import { DataTable } from '../ui/DataTable.jsx';
import { Button } from '../ui/Button.jsx';

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
  const canPrev = page > 1;
  const canNext = page < totalPages;
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
      render: (row) => formatHours(row.totalRegularHours),
    },
    {
      key: 'ot',
      label: 'OT',
      render: (row) => formatHours(row.totalOvertimeHours),
    },
    {
      key: 'nd',
      label: 'ND',
      render: (row) => formatHours(row.totalNightDifferentialHours),
    },
    {
      key: 'late',
      label: 'Late',
      render: (row) => formatMinutes(row.totalLateMinutes),
    },
    {
      key: 'undertime',
      label: 'Undertime',
      render: (row) => formatMinutes(row.totalUndertimeMinutes),
    },
  );

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => `${row.userId ?? ''}_${row.date}`}
        loading={loading}
        emptyTitle="No summaries"
        emptyMessage={emptyMessage}
        caption="Summary records"
      />
      {onPageChange && total > 0 && (
        <nav
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Summary table pagination"
        >
          <span>
            Showing {rows.length} of {total} · Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!canPrev || loading}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!canNext || loading}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
