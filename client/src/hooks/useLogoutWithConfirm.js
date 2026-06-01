import { useCallback } from 'react';
import { useAuthActions } from './useAuth.js';
import { useConfirm } from './useConfirm.js';

export function useLogoutWithConfirm() {
  const { logout } = useAuthActions();
  const confirm = useConfirm();

  return useCallback(async () => {
    const confirmed = await confirm({
      title: 'Log out',
      message: 'Are you sure you want to sign out of Mini HCM on this device?',
      confirmLabel: 'Log out',
      cancelLabel: 'Cancel',
    });
    if (confirmed) {
      logout();
    }
  }, [confirm, logout]);
}
