import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

export const Select = forwardRef(function Select(
  { className, error = false, inputSize = 'md', children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={error || undefined}
      className={cn('input', inputSize === 'sm' && 'input-sm', error && 'input-error', className)}
      {...props}
    >
      {children}
    </select>
  );
});
