import { cn } from '../../utils/cn.js';

/**
 * @param {{ className?: string; bodyClassName?: string; children: import('react').ReactNode }} props
 */
export function Card({ className, bodyClassName, children }) {
  return (
    <div className={cn('card', className)}>
      <div className={cn('card-body', bodyClassName)}>{children}</div>
    </div>
  );
}
