'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutProvider } from '../../contexts/LayoutContext';
import { getStoredUsername } from '../../services';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import Header from '../Header/Header';
import Sidebar from '../Sidebar';
import Footer from '../Footer/Footer';
import SessionTimeoutModal from '../SessionTimeoutModal';
import type { NavItem } from '../../types';
import type { MenuItem } from '../../services/menuService';
import styles from './AppLayout.module.css';

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/welcome' },
  { id: 'tasks', label: 'Tasks', href: '#tasks' },
  { id: 'activities', label: 'Activities', href: '#activities' },
  { id: 'program-oversight', label: 'Program Oversight', href: '#program-oversight' },
  { id: 'dashboards', label: 'Dashboards', href: '#dashboards' },
  { id: 'folders', label: 'Folders', href: '#folders' },
  { id: 'reports', label: 'Reports', href: '#reports' },
  { id: 'training', label: 'Training', href: '#training' },
];

interface FooterLink {
  id: string;
  label: string;
  href: string;
}

interface VersionInfo {
  product: string;
  platform: string;
  build: string;
}

export interface AppLayoutProps {
  children: React.ReactNode;
  menuItems?: MenuItem[];
  navItems?: NavItem[];
  activeNavItem?: string | null;
  defaultExpandedMenuIds?: string[];
  logoText?: string;
  footerLinks?: FooterLink[];
  footerSecondaryLinks?: FooterLink[];
  versionInfo?: VersionInfo;
}

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
}: AppLayoutProps) {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Session timeout tracking and modal
  const { showWarning, secondsRemaining, handleContinue, handleLogout } = useSessionTimeout();

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
        <SessionTimeoutModal
          open={showWarning}
          secondsRemaining={secondsRemaining}
          onContinue={handleContinue}
          onLogout={handleLogout}
        />
      </div>
    </LayoutProvider>
  );
}
