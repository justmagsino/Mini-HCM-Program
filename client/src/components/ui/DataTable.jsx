import { EmptyState } from './EmptyState.jsx';
import { TableSkeleton } from './LoadingSkeleton.jsx';
import { cn } from '../../utils/cn.js';

/**
 * @param {{
 *   columns: Array<{ key: string; label: string; align?: 'left' | 'right'; render?: (row: object) => import('react').ReactNode }>;
 *   rows: object[];
 *   rowKey: (row: object) => string;
 *   loading?: boolean;
 *   emptyMessage?: string;
 *   emptyTitle?: string;
 *   caption?: string;
 * }} props
 */
export function DataTable({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = 'No records to display.',
  emptyTitle = 'Nothing here yet',
  caption,
}) {
  if (loading) {
    return <TableSkeleton />;
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyMessage} />;
  }

  return (
    <div className="table-shell">
      <table className="table-base">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'table-th',
                  col.align === 'right' ? 'text-right' : 'text-left',
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-slate-50/80">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'table-td',
                    col.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
