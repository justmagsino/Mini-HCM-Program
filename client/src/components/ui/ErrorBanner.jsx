import { Button } from './Button.jsx';

/**
 * @param {{ message: string; onRetry?: () => void; retryLabel?: string }}
 */
export function ErrorBanner({ message, onRetry, retryLabel = 'Retry' }) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="shrink-0 self-start sm:self-auto">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
