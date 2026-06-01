import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

/**
 * @typedef {import('react').InputHTMLAttributes<HTMLInputElement> & {
 *   error?: boolean;
 *   inputSize?: 'md' | 'sm';
 * }} InputProps
 */

export const Input = forwardRef(function Input(
  { className, error = false, inputSize = 'md', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={error || undefined}
      className={cn('input', inputSize === 'sm' && 'input-sm', error && 'input-error', className)}
      {...props}
    />
  );
});
