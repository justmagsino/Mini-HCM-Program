import { useContext } from 'react';
import { AuthActionsContext, AuthStateContext } from '../contexts/AuthContext.jsx';

export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error('useAuthState must be used within AuthProvider');
  }
  return context;
}

export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (!context) {
    throw new Error('useAuthActions must be used within AuthProvider');
  }
  return context;
}

/** Full auth API — prefer useAuthState / useAuthActions when only one slice is needed. */
export function useAuth() {
  return { ...useAuthState(), ...useAuthActions() };
}
