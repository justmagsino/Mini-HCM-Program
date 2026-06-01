import { Link, NavLink } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuth.js';

/**
 * @param {{ onMenuClick?: () => void }} props
 */
export function AppNavbar({ onMenuClick }) {
  const { profile } = useAuthState();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/90">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-line p-2 text-ink hover:bg-cream-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden"
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
            className="truncate text-lg font-semibold text-navy focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Mini HCM
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <NavLink
            to="/profile"
            className="max-w-[12rem] truncate text-sm font-medium text-ink hover:text-primary"
            title="Your profile"
          >
            {profile?.fullName}
          </NavLink>
        </div>
      </div>
    </header>
  );
}
