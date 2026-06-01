import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';

/** @typedef {{
 *   title: string;
 *   message: import('react').ReactNode;
 *   confirmLabel?: string;
 *   cancelLabel?: string;
 *   confirmVariant?: 'primary' | 'secondary';
 * }} ConfirmOptions */

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  /** @type {[ConfirmOptions & { resolve: (value: boolean) => void } | null, Function]} */
  const [pending, setPending] = useState(null);

  const confirm = useCallback(
    /** @param {ConfirmOptions} options */
    (options) =>
      new Promise((resolve) => {
        setPending({ ...options, resolve });
      }),
    [],
  );

  const close = useCallback((result) => {
    setPending((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.title ?? ''}
        message={pending?.message ?? ''}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
        confirmVariant={pending?.confirmVariant}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context.confirm;
}
