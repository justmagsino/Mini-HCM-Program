import { NavLink } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuth.js';
import { cn } from '../../utils/cn.js';

const linkClass = ({ isActive }) =>
  cn('nav-link', isActive ? 'nav-link-active' : 'nav-link-inactive');

/**
 * @param {{ onNavigate?: () => void; onClose?: () => void }} props
 */
export function Sidebar({ onNavigate, onClose }) {
  const { isAdmin } = useAuthState();

  const handleClick = () => {
    onNavigate?.();
  };

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Menu</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
        <NavLink to="/dashboard" className={linkClass} onClick={handleClick} end>
          Dashboard
        </NavLink>
        <NavLink to="/attendance" className={linkClass} onClick={handleClick}>
          Attendance
        </NavLink>
        <NavLink to="/reports" className={linkClass} onClick={handleClick}>
          Reports
        </NavLink>
        {isAdmin && (
          <>
            <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Admin
            </p>
            <NavLink to="/admin/dashboard" className={linkClass} onClick={handleClick}>
              Overview
            </NavLink>
            <NavLink to="/admin/employees" className={linkClass} onClick={handleClick}>
              Employees
            </NavLink>
            <NavLink to="/admin/attendance" className={linkClass} onClick={handleClick}>
              Punch corrections
            </NavLink>
            <NavLink to="/admin/reports" className={linkClass} onClick={handleClick}>
              Daily & weekly reports
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
