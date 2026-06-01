import { NavLink } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuth.js';
import { useLogoutWithConfirm } from '../../hooks/useLogoutWithConfirm.js';
import { Button } from '../ui/Button.jsx';
import { cn } from '../../utils/cn.js';

const linkClass = ({ isActive }) =>
  cn('nav-link', isActive ? 'nav-link-active' : 'nav-link-inactive');

/**
 * @param {{
 *   to: string;
 *   end?: boolean;
 *   onClick?: () => void;
 *   icon: import('react').ReactNode;
 *   children: import('react').ReactNode;
 * }} props
 */
function SidebarLink({ to, end, onClick, icon, children }) {
  return (
    <NavLink to={to} end={end} className={linkClass} onClick={onClick}>
      <span className="flex items-center gap-2.5">
        <span className="nav-link-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="truncate">{children}</span>
      </span>
    </NavLink>
  );
}

/**
 * @param {{ onNavigate?: () => void; onClose?: () => void }} props
 */
export function Sidebar({ onNavigate, onClose }) {
  const { profile, isAdmin } = useAuthState();
  const handleLogout = useLogoutWithConfirm();

  const handleClick = () => {
    onNavigate?.();
  };

  const iconClass = 'h-[1.125rem] w-[1.125rem] shrink-0';

  return (
    <aside className="flex h-full flex-col border-r border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
        <p className="text-sm font-semibold text-navy">Navigation</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-cream-card"
            aria-label="Close navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3" aria-label="Main navigation">
        <div>
          <p className="nav-section-label">Menu</p>
          <div className="mt-1 space-y-0.5">
            <SidebarLink
              to="/dashboard"
              end
              onClick={handleClick}
              icon={
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              }
            >
              Dashboard
            </SidebarLink>
            <SidebarLink
              to="/attendance"
              onClick={handleClick}
              icon={
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            >
              Attendance
            </SidebarLink>
            <SidebarLink
              to="/reports"
              onClick={handleClick}
              icon={
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            >
              Reports
            </SidebarLink>
            <SidebarLink
              to="/profile"
              onClick={handleClick}
              icon={
                <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            >
              Profile
            </SidebarLink>
          </div>
        </div>

        {isAdmin && (
          <div>
            <p className="nav-section-label">Admin</p>
            <div className="mt-1 space-y-0.5">
              <SidebarLink
                to="/admin/dashboard"
                onClick={handleClick}
                icon={
                  <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                }
              >
                Overview
              </SidebarLink>
              <SidebarLink
                to="/admin/employees"
                onClick={handleClick}
                icon={
                  <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
              >
                Employees
              </SidebarLink>
              <SidebarLink
                to="/admin/attendance"
                onClick={handleClick}
                icon={
                  <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                }
              >
                Punch corrections
              </SidebarLink>
              <SidebarLink
                to="/admin/reports"
                onClick={handleClick}
                icon={
                  <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                }
              >
                Daily & weekly reports
              </SidebarLink>
            </div>
          </div>
        )}
      </nav>

      <div className="mt-auto border-t border-line bg-cream/60 p-3">
        {profile?.fullName && (
          <p className="mb-2 truncate px-2 text-xs font-medium text-ink-muted" title={profile.email}>
            {profile.fullName}
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full justify-center"
          onClick={() => {
            handleLogout();
            handleClick();
          }}
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
