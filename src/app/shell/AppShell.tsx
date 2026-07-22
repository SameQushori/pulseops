import { Activity, AlertTriangle, Layers3 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import styles from './AppShell.module.css';

const navigationItems = [
  { label: 'Overview', to: '/app/overview', icon: Activity },
  { label: 'Incidents', to: '/app/incidents', icon: AlertTriangle },
  { label: 'Services', to: '/app/services', icon: Layers3 },
] as const;

function NavigationLinks() {
  return navigationItems.map(({ label, to, icon: Icon }) => (
    <NavLink
      className={({ isActive }) =>
        `${styles.navigationLink} ${isActive ? styles.navigationLinkActive : ''}`
      }
      key={to}
      to={to}
    >
      <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
      <span>{label}</span>
    </NavLink>
  ));
}

export function AppShell() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const hasRenderedRoute = useRef(false);

  useEffect(() => {
    if (hasRenderedRoute.current) {
      mainRef.current?.focus();
    } else {
      hasRenderedRoute.current = true;
    }
  }, [location.pathname]);

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>

      <aside
        className={styles.sidebar}
        aria-label="PulseOps application sidebar"
      >
        <NavLink
          className={styles.brand}
          to="/app/overview"
          aria-label="PulseOps overview"
        >
          <span className={styles.brandMark} aria-hidden="true">
            P
          </span>
          <span>
            <strong>PulseOps</strong>
            <small>Incident console</small>
          </span>
        </NavLink>

        <nav
          className={styles.desktopNavigation}
          aria-label="Desktop primary navigation"
        >
          <NavigationLinks />
        </nav>

        <p className={styles.sidebarNote}>Operations workspace</p>
      </aside>

      <main
        className={styles.content}
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <nav
        className={styles.mobileNavigation}
        aria-label="Mobile primary navigation"
      >
        <NavigationLinks />
      </nav>
    </div>
  );
}
