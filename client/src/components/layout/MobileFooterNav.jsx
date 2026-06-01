import { NavLink } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuth.js';
import { adminMobileNav, employeeMobileNav } from '../../config/mobileNav.jsx';
import { cn } from '../../utils/cn.js';

/**
 * @param {{ to: string; end?: boolean; label: string; icon: import('react').ReactNode }} item
 */
function FooterNavItem({ to, end, label, icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn('mobile-footer-link', isActive ? 'mobile-footer-link-active' : 'mobile-footer-link-inactive')
      }
    >
      <span className="mobile-footer-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="mobile-footer-label">{label}</span>
    </NavLink>
  );
}

export function MobileFooterNav() {
  const { isAdmin } = useAuthState();
  const items = isAdmin ? adminMobileNav : employeeMobileNav;

  return (
    <nav className="mobile-footer-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <FooterNavItem key={item.to} {...item} />
      ))}
    </nav>
  );
}
