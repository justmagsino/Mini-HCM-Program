import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthActions, useAuthState } from '../../hooks/useAuth.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.jsx';
import { Button } from '../ui/Button.jsx';
import { Alert } from '../ui/Alert.jsx';
import { PageContainer } from '../ui/PageContainer.jsx';

export function ProtectedRoute() {
  const { isAuthenticated, profile, profileError, loading } = useAuthState();
  const { logout, refreshProfile } = useAuthActions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <LoadingSpinner label="Loading your session…" size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!profile) {
    if (profileError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-cream px-4">
          <PageContainer narrow className="max-w-md space-y-4">
            <Alert variant="error">{profileError}</Alert>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => refreshProfile()}>Retry</Button>
              <Button variant="secondary" onClick={() => logout()}>
                Sign out
              </Button>
            </div>
          </PageContainer>
        </div>
      );
    }
    return <Navigate to="/register" replace state={{ from: location, completeProfile: true }} />;
  }

  return <Outlet />;
}
