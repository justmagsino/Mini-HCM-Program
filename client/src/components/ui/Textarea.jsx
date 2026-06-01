import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

export const Textarea = forwardRef(function Textarea(
  { className, error = false, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={error || undefined}
      className={cn('input min-h-[5rem] resize-y', error && 'input-error', className)}
      {...props}
    />
  );
});
