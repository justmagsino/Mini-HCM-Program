/**
 * Single card: toolbar (filters) flush on top, table + pagination below.
 *
 * @param {{ toolbar?: import('react').ReactNode; children: import('react').ReactNode }} props
 */
export function TableWithToolbar({ toolbar, children }) {
  return (
    <div className="table-panel">
      {toolbar ? <div className="table-panel-toolbar">{toolbar}</div> : null}
      {children}
    </div>
  );
}
