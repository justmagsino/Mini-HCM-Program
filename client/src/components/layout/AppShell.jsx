import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppNavbar } from './AppNavbar.jsx';
import { Sidebar } from './Sidebar.jsx';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMobile();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    const focusable = drawerRef.current?.querySelector('a, button');
    focusable?.focus();

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg focus:ring-2 focus:ring-primary/30"
      >
        Skip to main content
      </a>
      <AppNavbar onMenuClick={() => setMobileOpen(true)} />

      <div className="flex">
        <div className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <Sidebar />
          </div>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <button
              type="button"
              className="absolute inset-0 bg-navy-deep/50 backdrop-blur-[1px]"
              aria-label="Close menu"
              onClick={closeMobile}
            />
            <div ref={drawerRef} className="absolute left-0 top-0 h-full w-64 max-w-[85vw] shadow-2xl">
              <Sidebar onNavigate={closeMobile} onClose={closeMobile} />
            </div>
          </div>
        )}

        <main id="main-content" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
