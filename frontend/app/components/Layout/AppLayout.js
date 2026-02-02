'use client';

import { LayoutProvider } from '../../contexts/LayoutContext';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Footer from '../Footer';
import styles from './AppLayout.module.css';

const DEFAULT_NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '#home' },
  { id: 'tasks', label: 'Tasks', href: '#tasks' },
  { id: 'activities', label: 'Activities', href: '#activities' },
  { id: 'program-oversight', label: 'Program Oversight', href: '#program-oversight' },
  { id: 'dashboards', label: 'Dashboards', href: '#dashboards' },
  { id: 'folders', label: 'Folders', href: '#folders' },
  { id: 'reports', label: 'Reports', href: '#reports' },
  { id: 'training', label: 'Training', href: '#training' },
];

export default function AppLayout({
  children,
  menuItems = [],
  navItems = DEFAULT_NAV_ITEMS,
  activeNavItem = null,
  defaultExpandedMenuIds = [],
  user = 'cabrahms', // TODO: Get user from backend
  logoText = 'HRSA Electronic Handbooks',
  footerLinks,
  footerSecondaryLinks,
  versionInfo,
}) {
  return (
    <LayoutProvider initialUser={user}>
      <div className={styles.wrapper}>
        <Header
          logoText={logoText}
          navItems={navItems}
          activeNavItem={activeNavItem}
        />
        <div className={styles.bodyMain}>
          <Sidebar
            menuItems={menuItems}
            defaultExpandedIds={defaultExpandedMenuIds}
          />
          <div className={styles.contentCenter}>
            <div className={styles.mainArea}>
              {children}
            </div>
          </div>
        </div>
        <Footer
          links={footerLinks}
          secondaryLinks={footerSecondaryLinks}
          versionInfo={versionInfo}
        />
      </div>
    </LayoutProvider>
  );
}
