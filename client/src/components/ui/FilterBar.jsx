/**
 * @param {{ className?: string; children: import('react').ReactNode }} props
 */
export function FilterBar({ className = '', children }) {
  return <div className={`filter-bar ${className}`}>{children}</div>;
}
