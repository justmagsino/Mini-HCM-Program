import { DataTable } from './DataTable.jsx';
import { Button } from './Button.jsx';

/**
 * @param {{
 *   columns: import('./DataTable.jsx').props.columns;
 *   rows: object[];
 *   rowKey: (row: object) => string;
 *   loading?: boolean;
 *   emptyMessage?: string;
 *   emptyTitle?: string;
 *   page: number;
 *   limit: number;
 *   total: number;
 *   onPageChange: (page: number) => void;
 * }} props
 */
export function PaginatedTable({
  columns,
  rows,
  rowKey,
  loading,
  emptyMessage,
  emptyTitle,
  page,
  limit,
  total,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        loading={loading}
        emptyMessage={emptyMessage}
        emptyTitle={emptyTitle}
      />
      {total > 0 && (
        <nav
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Table pagination"
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
