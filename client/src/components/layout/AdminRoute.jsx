import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuth.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.jsx';

export function AdminRoute() {
  const { isAdmin, loading } = useAuthState();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Loading…" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
