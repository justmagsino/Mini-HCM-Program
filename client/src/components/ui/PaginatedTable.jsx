import { DataTable } from './DataTable.jsx';
import { TablePaginationFooter } from './TablePaginationFooter.jsx';

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

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={rowKey}
      loading={loading}
      emptyMessage={emptyMessage}
      emptyTitle={emptyTitle}
      minRows={total > 0 ? limit : 0}
      footer={
        total > 0 ? (
          <TablePaginationFooter
            pageRowCount={rows.length}
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            loading={loading}
          />
        ) : null
      }
    />
  );
}
