import { cn } from '../../utils/cn.js';

/**
 * @param {{ label: string; value: string; hint?: string; variant?: 'default' | 'accent' }} props
 */
export function StatCard({ label, value, hint, variant = 'default' }) {
  const styles =
    variant === 'accent'
      ? 'border-primary/25 bg-cream-card'
      : 'border-line bg-white';

  return (
    <div className={cn('card border p-0', styles)}>
      <div className="card-body py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-navy">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
    </div>
  );
}
