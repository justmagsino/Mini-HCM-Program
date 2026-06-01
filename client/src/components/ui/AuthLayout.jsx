/**
 * @param {{ title: string; subtitle?: string; children: import('react').ReactNode; footer?: import('react').ReactNode }} props
 */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="badge-soft">Mini HCM</p>
          <h1 className="mt-3 text-page-title text-navy">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink">{subtitle}</p>}
        </div>
        <div className="card">
          <div className="card-body">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-ink">{footer}</div>}
      </div>
    </div>
  );
}
