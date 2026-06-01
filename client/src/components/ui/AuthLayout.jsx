/**
 * @param {{ title: string; subtitle?: string; children: import('react').ReactNode; footer?: import('react').ReactNode }} props
 */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Mini HCM</p>
          <h1 className="mt-2 text-page-title text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
        </div>
        <div className="card">
          <div className="card-body">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}
