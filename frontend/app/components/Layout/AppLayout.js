'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutProvider } from '../../contexts/LayoutContext';
import { getStoredUsername } from '../../services';
import Header from '../Header/Header';
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
  logoText = 'HRSA : PPRS Community Development',
  footerLinks,
  footerSecondaryLinks,
  versionInfo,
}) {
  const router = useRouter();
  const [username, setUsername] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const name = getStoredUsername();
    setSessionChecked(true);
    if (!name) {
      router.replace('/login');
      return;
    }
    setUsername(name);
  }, [router]);

  if (!sessionChecked || !username) {
    return null;
  }

  return (
    <LayoutProvider initialUser={username}>
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
