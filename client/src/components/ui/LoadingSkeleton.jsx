import { cn } from '../../utils/cn.js';

/**
 * @param {{ className?: string }} props
 */
export function LoadingSkeleton({ className = '' }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} aria-hidden="true" />;
}

export function StatCardSkeleton() {
  return (
    <div className="card">
      <div className="card-body">
        <LoadingSkeleton className="h-3 w-20" />
        <LoadingSkeleton className="mt-3 h-8 w-24" />
        <LoadingSkeleton className="mt-2 h-3 w-32" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="card">
      <div className="card-body">
        <LoadingSkeleton className="mb-4 h-5 w-40" />
        <LoadingSkeleton className="h-56 w-full sm:h-64" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="card" role="status" aria-label="Loading table">
      <div className="card-body space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
