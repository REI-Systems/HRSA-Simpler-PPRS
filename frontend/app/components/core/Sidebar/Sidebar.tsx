'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLayout } from '../../../contexts/LayoutContext';
import type { MenuItem } from '../../../services/menuService';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  menuItems?: MenuItem[];
  title?: string;
  allTasksLabel?: string;
  onMenuItemClick?: ((item: MenuItem) => void) | null;
  defaultExpandedIds?: string[];
}

export default function Sidebar({
  menuItems = [],
  title = 'Main Menu',
  allTasksLabel = 'All Tasks',
  onMenuItemClick = null,
  defaultExpandedIds = [],
}: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarPinned, setSidebarPinned, toggleSidebar, toggleSidebarPin } = useLayout();
  const [expandedMenuIds, setExpandedMenuIds] = useState<string[]>(defaultExpandedIds);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuAnimating, setMenuAnimating] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (sidebarPinned) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarPinned, setSidebarOpen]);

  const toggleMenuExpand = (id: string) => {
    setExpandedMenuIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const filteredMenuItems = useMemo(() => {
    const term = menuSearch.trim().toLowerCase();
    if (!term) return menuItems;
    const itemMatchesSearch = (item: MenuItem) => {
      const labelMatch = (item.label || '').toLowerCase().includes(term);
      const idMatch = (item.id || '').toLowerCase().includes(term);
      const childMatch = (item.children || []).some((c) => (c.label || '').toLowerCase().includes(term) || (c.id || '').toLowerCase().includes(term));
      return labelMatch || idMatch || childMatch;
    };
    return menuItems.filter(itemMatchesSearch);
  }, [menuItems, menuSearch]);

  useEffect(() => {
    setMenuAnimating(true);
    const t = setTimeout(() => setMenuAnimating(false), 320);
    return () => clearTimeout(t);
  }, [filteredMenuItems]);

  useEffect(() => {
    const term = menuSearch.trim();
    if (term) {
      const idsToExpand = filteredMenuItems
        .filter((item) => item.children && item.children.length > 0)
        .map((item) => item.id);
      setExpandedMenuIds((prev) => {
        const combined = new Set([...prev, ...idsToExpand]);
        return [...combined];
      });
    } else {
      const idsWithActiveChild = menuItems
        .filter((item) => item.children?.some((c) => {
          const href = (c.href || '').replace(/\/$/, '');
          const p = (pathname || '').replace(/\/$/, '');
          return href && (p === href || p.startsWith(href + '/'));
        }))
        .map((item) => item.id);
      const toExpand = idsWithActiveChild.length > 0
        ? [...new Set([...defaultExpandedIds, ...idsWithActiveChild])]
        : defaultExpandedIds;
      setExpandedMenuIds(toExpand);
    }
  }, [menuSearch, pathname, menuItems, defaultExpandedIds, filteredMenuItems]);

  const handleItemClick = (item: MenuItem) => {
    if (onMenuItemClick) {
      onMenuItemClick(item);
    }
    toggleMenuExpand(item.id);
  };

  const isPathActive = (href: string | undefined) => {
    const path = (pathname || '').replace(/\/$/, '');
    const h = (href || '').replace(/\/$/, '');
    return h && (path === h || path.startsWith(h + '/'));
  };

  const isChildActive = (item: MenuItem, child: { id: string; label: string; href?: string; header?: boolean }) => {
    if (!child.href || child.header) return false;
    if (!isPathActive(child.href)) return false;
    const childHrefLen = (child.href || '').replace(/\/$/, '').length;
    const hasMoreSpecificSibling = item.children?.some(
      (c) => !c.header && c !== child && isPathActive(c.href) && (c.href || '').replace(/\/$/, '').length > childHrefLen
    );
    return !hasMoreSpecificSibling;
  };

  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`} ref={sidebarRef}>
      <div className={styles.sidebarHeader}>
        <button type="button" className={styles.sidebarMenuToggleBtn} onClick={toggleSidebar} aria-label="Toggle menu">
          <i className="bi bi-list" aria-hidden />
        </button>
        <div className={styles.sidebarHeaderContent}>
          <span className={styles.sidebarTitle}>{title}</span>
          <button
            type="button"
            className={`${styles.sidebarPinBtn} ${sidebarPinned ? styles.sidebarPinned : ''}`}
            onClick={toggleSidebarPin}
            aria-label={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            <i className={sidebarPinned ? 'bi bi-pin-fill' : 'bi bi-pin-angle'} aria-hidden />
          </button>
        </div>
      </div>
      <div className={styles.sidebarBody}>
        <div className={styles.sidebarSearchRow}>
          <input
            type="text"
            className={styles.sidebarSearchInput}
            placeholder="Search"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            aria-label="Search menu"
          />
          <button type="button" className={styles.sidebarSearchSubmit} aria-label="Search">
            <i className="bi bi-search" aria-hidden />
          </button>
        </div>
        <p className={styles.sidebarAllTasks}>{allTasksLabel}</p>
        <nav className={styles.sidebarNav}>
          <ul className={`${styles.sidebarMenuList} ${menuAnimating ? styles.menuListAnimate : ''}`}>
            {filteredMenuItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenuIds.includes(item.id);
              const hasActiveChild = hasChildren && item.children!.some((c) => !c.header && isChildActive(item, c));
              const isParentActive = hasActiveChild;
              return (
                <li key={item.id} className={styles.sidebarMenuItemWrap}>
                  {hasChildren ? (
                    <>
                      <button
                        type="button"
                        className={`${styles.sidebarMenuItem} ${isParentActive ? styles.sidebarMenuItemActive : ''}`}
                        onClick={() => handleItemClick(item)}
                      >
                        <span className={styles.sidebarMenuItemText}>{item.label}</span>
                        <span className={styles.sidebarMenuItemChevron} aria-hidden>{isExpanded ? '▲' : '▼'}</span>
                      </button>
                      {isExpanded && (
                        <ul className={styles.sidebarSubList}>
                          {item.children!.map((child) => {
                            if (child.header) {
                              return (
                                <li key={child.id}>
                                  <span className={styles.sidebarSubHeader}>{child.label}</span>
                                </li>
                              );
                            }
                            const isChildActiveVal = isChildActive(item, child);
                            return (
                              <li key={child.id}>
                                <a
                                  href={child.href || '#'}
                                  className={`${styles.sidebarSubItem} ${isChildActiveVal ? styles.sidebarSubItemActive : ''}`}
                                >
                                  {child.label}
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <a
                      href={(item as MenuItem & { href?: string }).href || '#'}
                      className={`${styles.sidebarMenuItemLink} ${isPathActive((item as MenuItem & { href?: string }).href) ? styles.sidebarMenuItemLinkActive : ''}`}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
