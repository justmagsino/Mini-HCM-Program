import { LoadingSpinner } from './LoadingSpinner.jsx';

/**
 * @param {{ message?: string; className?: string; inline?: boolean }} props
 */
export function LoadingMessage({ message = 'Loading…', className, inline = false }) {
  if (inline) {
    return <p className={`text-sm text-slate-500 ${className ?? ''}`}>{message}</p>;
  }

  return <LoadingSpinner label={message} className={className} size="sm" />;
}
