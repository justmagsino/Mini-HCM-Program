/**
 * @param {{
 *   label?: string;
 *   htmlFor?: string;
 *   error?: string;
 *   hint?: string;
 *   required?: boolean;
 *   className?: string;
 *   children: import('react').ReactNode;
 * }} props
 */
export function FormField({ label, htmlFor, error, hint, required, className = '', children }) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && (
            <span className="text-red-500" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className="field-hint">{hint}</p>}
    </div>
  );
}
