import { Link } from 'react-router-dom';

/**
 * @param {{ to: string; title: string; description: string }} props
 */
export function LinkCard({ to, title, description }) {
  return (
    <Link
      to={to}
      className="card block transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="card-body">
        <p className="font-medium text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}
