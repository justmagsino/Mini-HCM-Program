import { Link } from 'react-router-dom';
import { useAuthActions, useAuthState } from '../../hooks/useAuth.js';
import { Button } from '../ui/Button.jsx';

/**
 * @param {{ onMenuClick?: () => void }} props
 */
export function AppNavbar({ onMenuClick }) {
  const { profile } = useAuthState();
  const { logout } = useAuthActions();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            aria-expanded={false}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            to="/dashboard"
            className="truncate text-lg font-semibold text-primary focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Mini HCM
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-[12rem] truncate text-sm text-slate-600 sm:inline" title={profile?.fullName}>
            {profile?.fullName}
          </span>
          <Button variant="secondary" size="sm" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
