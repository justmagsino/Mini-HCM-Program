import { cn } from '../../utils/cn.js';

const variants = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-line bg-primary-light text-navy',
};

/**
 * @param {{ variant?: keyof typeof variants; className?: string; children: import('react').ReactNode; role?: string }} props
 */
export function Alert({ variant = 'info', className, children, role }) {
  const alertRole = role ?? (variant === 'error' ? 'alert' : 'status');

  return (
    <div
      role={alertRole}
      className={cn('rounded-lg border px-4 py-3 text-sm', variants[variant], className)}
    >
      {children}
    </div>
  );
}
