import { EmptyState } from './EmptyState.jsx';
import { TableSkeleton } from './LoadingSkeleton.jsx';
import { cn } from '../../utils/cn.js';

/** @param {'left' | 'center' | 'right'} [align] */
function tableAlignClass(align) {
  if (align === 'center') {
    return 'text-center';
  }
  if (align === 'right') {
    return 'text-right';
  }
  return 'text-left';
}

/**
 * @param {{
 *   columns: Array<{
 *     key: string;
 *     label: string;
 *     align?: 'left' | 'center' | 'right';
 *     render?: (row: object) => import('react').ReactNode;
 *   }>;
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
        <thead className="bg-cream-card">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn('table-th', tableAlignClass(col.align))}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-cream/80">
              {columns.map((col) => (
                <td key={col.key} className={cn('table-td', tableAlignClass(col.align))}>
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
