'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLayout } from '../../../contexts/LayoutContext';
import { logout } from '../../../services';
import type { NavItem, UserLink } from '../../../types';
import styles from './Header.module.css';

const USER_DROPDOWN_ITEMS = [
  { id: 'profile', label: 'View/Update Profile', href: '#profile' },
  { id: 'favorites', label: 'Manage Favorites', href: '#favorites' },
  { id: 'recent', label: 'Recently Accessed', href: '#recent' },
  { id: 'backup', label: 'Set Backup', href: '#backup' },
];

const REQUEST_ACCESS_DROPDOWN_ITEMS = [
  { id: 'new-account', label: 'New Account', href: '#new-account' },
  { id: 'role-modification', label: 'Role Modification', href: '#role-modification' },
];

const SUPPORT_DROPDOWN_ITEMS = [
  { id: 'help-center', label: 'Help Center', href: '#help-center' },
  { id: 'contact-us', label: 'Contact Us', href: '#contact-us' },
];

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

const DEFAULT_USER_LINKS: UserLink[] = [
  { id: 'user', label: null, href: '#user', hasDropdown: true },
  { id: 'request-access', label: 'Request Access', href: '#request-access', hasDropdown: true },
  { id: 'support', label: 'Help', href: '#support', hasDropdown: true },
  { id: 'logout', label: 'Logout', href: '#logout', hasDropdown: false },
];

interface DropdownItem {
  id: string;
  label: string;
  href: string;
}

export interface HeaderProps {
  logoText?: string;
  logoHref?: string;
  navItems?: NavItem[];
  activeNavItem?: string | null;
  userLinks?: UserLink[];
  showDateTime?: boolean;
}

export default function Header({
  logoText = 'HRSA : PPRS Community Development',
  logoHref = '/',
  navItems = DEFAULT_NAV_ITEMS,
  activeNavItem = null,
  userLinks = DEFAULT_USER_LINKS,
  showDateTime = true,
}: HeaderProps) {
  const router = useRouter();
  const { displayDateTime, user } = useLayout();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const closeAllDropdowns = () => setOpenDropdownId(null);
  const toggleDropdown = (id: string | null) => setOpenDropdownId((prev) => (prev === id ? null : id));

  const handleLogout = async () => {
    closeAllDropdowns();
    await logout();
    router.push('/login');
  };

  useEffect(() => {
    if (!openDropdownId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const ref = dropdownRefs.current[openDropdownId];
      if (ref && !ref.contains(e.target as Node)) closeAllDropdowns();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  const getDropdownItems = (dropdownId: string | null): DropdownItem[] => {
    if (dropdownId === 'user') return USER_DROPDOWN_ITEMS;
    if (dropdownId === 'request-access') return REQUEST_ACCESS_DROPDOWN_ITEMS;
    if (dropdownId === 'support') return SUPPORT_DROPDOWN_ITEMS;
    return [];
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerRow1}>
        <div className={styles.logoSection}>
          <a href={logoHref} className={styles.logo}>{logoText}</a>
        </div>
        <div className={styles.headerUserLinks}>
          {userLinks.map((link) => {
            const isDropdown = link.hasDropdown;
            const dropdownId = isDropdown ? link.id : null;
            const items = getDropdownItems(dropdownId);
            const isOpen = openDropdownId === dropdownId;
            const triggerLabel = link.id === 'user' ? user : link.label;

            if (!isDropdown) {
              if (link.id === 'logout') {
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={handleLogout}
                    className={`${styles.headerUserItem} ${styles.headerLogoutBtn}`}
                  >
                    {link.label}
                  </button>
                );
              }
              return (
                <a key={link.id} href={link.href} className={styles.headerUserItem}>
                  {link.label}
                </a>
              );
            }

            return (
              <div
                key={link.id}
                className={`${styles.headerDropdownWrap} ${isOpen ? styles.headerDropdownOpen : ''}`}
                ref={(el) => { if (dropdownId) dropdownRefs.current[dropdownId] = el; }}
              >
                <button
                  type="button"
                  className={styles.headerUserItem}
                  onClick={() => toggleDropdown(dropdownId)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  {triggerLabel}
                  <i className="bi bi-chevron-down" aria-hidden />
                </button>
                {isOpen && (
                  <div className={styles.headerDropdown}>
                    {items.map((item, index) => (
                      <div key={item.id}>
                        {index > 0 && <div className={styles.headerDropdownSeparator} />}
                        <a href={item.href} className={styles.headerDropdownItem}>
                          {item.label}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {(navItems.length > 0 || showDateTime) && (
        <div className={styles.headerRow2}>
          <nav className={styles.headerNav}>
            <ul className={styles.mainNav}>
              {navItems.map((item) => {
                const href = item.id === 'home' ? '/welcome' : (item.href || '#');
                const isInternal = href.startsWith('/');
                const className = item.id === activeNavItem ? styles.navItemActive : undefined;
                return (
                  <li key={item.id} className={styles.navItem}>
                    {isInternal ? (
                      <Link href={href} className={className}>
                        {item.label}
                      </Link>
                    ) : (
                      <a href={href} className={className}>
                        {item.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
          {showDateTime && (
            <span className={styles.headerDateTime} suppressHydrationWarning>{displayDateTime}</span>
          )}
        </div>
      )}
    </header>
  );
}
