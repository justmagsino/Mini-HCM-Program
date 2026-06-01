import { cn } from '../../utils/cn.js';

/**
 * @param {Array<{
 *   key: string;
 *   label: string;
 *   align?: 'left' | 'center' | 'right';
 *   render?: (row: object) => import('react').ReactNode;
 * }>} columns
 */
function splitColumns(columns) {
  /** @type {typeof columns} */
  const header = [];
  /** @type {typeof columns} */
  const metrics = [];
  /** @type {typeof columns} */
  const actions = [];

  for (const col of columns) {
    if (col.key === 'edit' || col.key === 'actions' || col.label === 'Actions') {
      actions.push(col);
      continue;
    }
    if (col.align === 'center' || col.align === 'right') {
      metrics.push(col);
    } else {
      header.push(col);
    }
  }

  return { header, metrics, actions };
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
 * }} props
 */
export function DataCardList({ columns, rows, rowKey }) {
  const { header, metrics, actions } = splitColumns(columns);

  return (
    <ul className="data-card-list" role="list">
      {rows.map((row) => (
        <li key={rowKey(row)}>
          <article className="data-record-card">
            {header.length > 0 && (
              <div className="data-record-card-header">
                {header.map((col, index) => {
                  const value = col.render ? col.render(row) : row[col.key];
                  if (index === 0) {
                    const hideKicker = col.key === 'date';
                    return (
                      <div key={col.key} className="min-w-0">
                        {!hideKicker && <p className="data-record-card-kicker">{col.label}</p>}
                        <div className="data-record-card-title">{value}</div>
                      </div>
                    );
                  }
                  return (
                    <p key={col.key} className="text-sm text-ink-muted">
                      <span className="font-medium">{col.label}: </span>
                      {value}
                    </p>
                  );
                })}
              </div>
            )}

            {metrics.length > 0 && (
              <dl className="data-record-metrics">
                {metrics.map((col) => (
                  <div key={col.key} className="data-record-metric">
                    <dt>{col.label}</dt>
                    <dd>{col.render ? col.render(row) : row[col.key]}</dd>
                  </div>
                ))}
              </dl>
            )}

            {actions.length > 0 && (
              <div className={cn('data-record-actions', metrics.length === 0 && 'border-t-0 pt-0')}>
                {actions.map((col) => (
                  <div key={col.key} className="flex justify-end">
                    {col.render ? col.render(row) : row[col.key]}
                  </div>
                ))}
              </div>
            )}
          </article>
        </li>
      ))}
    </ul>
  );
}
