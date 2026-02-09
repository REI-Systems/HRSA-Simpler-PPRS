'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLayout } from '../../contexts/LayoutContext';
import styles from './Sidebar.module.css';

export default function Sidebar({
  menuItems = [],
  title = 'Main Menu',
  allTasksLabel = 'All Tasks',
  onMenuItemClick = null,
  defaultExpandedIds = [],
}) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarPinned, setSidebarPinned, toggleSidebar, toggleSidebarPin } = useLayout();
  const [expandedMenuIds, setExpandedMenuIds] = useState(defaultExpandedIds);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuAnimating, setMenuAnimating] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (sidebarPinned) return;
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarPinned, setSidebarOpen]);

  const toggleMenuExpand = (id) => {
    setExpandedMenuIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const filteredMenuItems = useMemo(() => {
    const term = menuSearch.trim().toLowerCase();
    if (!term) return menuItems;
    const itemMatchesSearch = (item) => {
      const labelMatch = (item.label || '').toLowerCase().includes(term);
      const idMatch = (item.id || '').toLowerCase().includes(term);
      const childMatch = (item.children || []).some((c) => (c.label || '').toLowerCase().includes(term) || (c.id || '').toLowerCase().includes(term));
      return labelMatch || idMatch || childMatch;
    };
    return menuItems.filter(itemMatchesSearch);
  }, [menuItems, menuSearch]);

  // Trigger animation when search results change
  useEffect(() => {
    setMenuAnimating(true);
    const t = setTimeout(() => setMenuAnimating(false), 320);
    return () => clearTimeout(t);
  }, [filteredMenuItems]);

  // Expand parent when it contains the active child; when searching, expand matching items
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
  }, [menuSearch, pathname]);

  const handleItemClick = (item) => {
    if (onMenuItemClick) {
      onMenuItemClick(item);
    }
    toggleMenuExpand(item.id);
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
              const path = (pathname || '').replace(/\/$/, '');
              const isPathActive = (href) => {
                const h = (href || '').replace(/\/$/, '');
                return h && (path === h || path.startsWith(h + '/'));
              };
              /** Active only if this child matches path and no sibling with a longer href also matches (most specific wins). */
              const isChildActive = (child) => {
                if (!child.href || child.header) return false;
                if (!isPathActive(child.href)) return false;
                const childHrefLen = (child.href || '').replace(/\/$/, '').length;
                const hasMoreSpecificSibling = item.children.some(
                  (c) => !c.header && c !== child && isPathActive(c.href) && (c.href || '').replace(/\/$/, '').length > childHrefLen
                );
                return !hasMoreSpecificSibling;
              };
              const hasActiveChild = hasChildren && item.children.some((c) => !c.header && isChildActive(c));
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
                          {item.children.map((child) => {
                            if (child.header) {
                              return (
                                <li key={child.id}>
                                  <span className={styles.sidebarSubHeader}>{child.label}</span>
                                </li>
                              );
                            }
                            const isChildActiveVal = isChildActive(child);
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
                      href={item.href || '#'}
                      className={`${styles.sidebarMenuItemLink} ${isPathActive(item.href) ? styles.sidebarMenuItemLinkActive : ''}`}
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
