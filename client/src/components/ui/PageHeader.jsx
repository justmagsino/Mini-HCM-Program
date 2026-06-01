/**
 * @param {{ title: string; description?: string; actions?: import('react').ReactNode }} props
 */
export function PageHeader({ title, description, actions }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-page-title text-navy">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink">{description}</p>}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-wrap items-end gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
