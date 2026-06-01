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
 *   minRows?: number;
 *   footer?: import('react').ReactNode;
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
  minRows = 0,
  footer = null,
}) {
  if (loading) {
    return <TableSkeleton />;
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyMessage} />;
  }

  const padCount = minRows > 0 ? Math.max(0, minRows - rows.length) : 0;

  const table = (
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
          {Array.from({ length: padCount }, (_, i) => (
            <tr key={`pad-${i}`} className="table-row-pad" aria-hidden="true">
              {columns.map((col) => (
                <td key={col.key} className={cn('table-td', tableAlignClass(col.align))}>
                  {'\u00a0'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (footer) {
    return (
      <div className="table-card">
        {table}
        {footer}
      </div>
    );
  }

  return table;
}
