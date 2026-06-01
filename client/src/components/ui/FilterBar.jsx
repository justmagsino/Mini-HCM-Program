/**
 * @param {{ className?: string; children: import('react').ReactNode }} props
 */
/**
 * Toolbar row for filters — inputs, selects, and buttons share `h-9` (sm) via index.css.
 * @param {{ className?: string; children: import('react').ReactNode }} props
 */
export function FilterBar({ className = '', children }) {
  return <div className={`filter-bar ${className}`}>{children}</div>;
}

/**
 * Wraps a button beside labeled fields so it lines up with inputs (not the label).
 * @param {{ children: import('react').ReactNode; className?: string }} props
 */
export function FilterBarAction({ children, className = '' }) {
  return <div className={`filter-bar-action ${className}`}>{children}</div>;
}
