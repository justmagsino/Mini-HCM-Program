/**
 * @param {{ title: string; description?: string; action?: import('react').ReactNode }} props
 */
export function EmptyState({ title, description, action }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center sm:py-14"
      role="status"
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
        aria-hidden="true"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-base font-medium text-slate-800">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
