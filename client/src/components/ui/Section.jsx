/**
 * @param {{ title?: string; description?: string; actions?: import('react').ReactNode; className?: string; children: import('react').ReactNode }} props
 */
export function Section({ title, description, actions, className = '', children }) {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="section-title">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
