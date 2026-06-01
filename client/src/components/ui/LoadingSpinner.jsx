import { cn } from '../../utils/cn.js';

/**
 * @param {{ label?: string; className?: string; size?: 'sm' | 'md' | 'lg' }} props
 */
export function LoadingSpinner({ label = 'Loading', className, size = 'md' }) {
  const sizeClass =
    size === 'sm' ? 'h-5 w-5 border-2' : size === 'lg' ? 'h-10 w-10 border-[3px]' : 'h-8 w-8 border-2';

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-8', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className={cn(
          'inline-block animate-spin rounded-full border-primary border-t-transparent',
          sizeClass,
        )}
        aria-hidden="true"
      />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}
