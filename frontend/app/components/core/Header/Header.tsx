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
  const { displayDateTime, user, sidebarOpen, toggleSidebar } = useLayout();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleNavItems, setVisibleNavItems] = useState<NavItem[]>(() => 
    (navItems || []).filter((item): item is NavItem => item != null && typeof item === 'object' && 'id' in item)
  );
  const [overflowNavItems, setOverflowNavItems] = useState<NavItem[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [visibleUserLinks, setVisibleUserLinks] = useState<UserLink[]>(() => 
    (userLinks || []).filter((link): link is UserLink => link != null && 'id' in link)
  );
  const [overflowUserLinks, setOverflowUserLinks] = useState<UserLink[]>([]);
  const [showMoreUserMenu, setShowMoreUserMenu] = useState(false);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dropdownElementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navContainerRef = useRef<HTMLUListElement>(null);
  const navItemsRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const moreMenuRef = useRef<HTMLLIElement>(null);
  const moreMenuButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuDropdownRef = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const userLinksContainerRef = useRef<HTMLDivElement>(null);
  const userLinkRefs = useRef<Record<string, HTMLElement | null>>({});
  const moreUserMenuRef = useRef<HTMLDivElement>(null);
  const moreUserMenuButtonRef = useRef<HTMLButtonElement>(null);
  const moreUserMenuDropdownRef = useRef<HTMLDivElement>(null);

  const closeAllDropdowns = () => {
    setOpenDropdownId(null);
    setShowMoreMenu(false);
    setShowMoreUserMenu(false);
  };
  const toggleDropdown = (id: string | null) => {
    setOpenDropdownId((prev) => {
      const newState = prev === id ? null : id;
      // Position dropdown dynamically when opening (on mobile or when using fixed positioning)
      if (newState && id) {
        requestAnimationFrame(() => {
          const dropdown = dropdownElementRefs.current[id];
          const dropdownWrap = dropdownRefs.current[id];
          if (dropdown && dropdownWrap) {
            // Find the button element within the wrapper
            const button = dropdownWrap.querySelector('button') as HTMLElement;
            if (button) {
              const buttonRect = button.getBoundingClientRect();
              const viewportWidth = window.innerWidth;
              const dropdownWidth = 200; // Approximate dropdown width
              
              // Position dropdown below button, aligned with button's left edge
              let leftPosition = buttonRect.left + window.scrollX;
              
              // If dropdown goes off-screen to the right, shift it left
              if (leftPosition + dropdownWidth > viewportWidth - 8) {
                leftPosition = viewportWidth - dropdownWidth - 8;
              }
              
              // If dropdown goes off-screen to the left, shift it right
              if (leftPosition < 8) {
                leftPosition = 8;
              }
              
              // On mobile, use fixed positioning; on desktop, use absolute
              if (isMobile) {
                dropdown.style.position = 'fixed';
                dropdown.style.top = `${buttonRect.bottom + window.scrollY + 8}px`;
                dropdown.style.left = `${leftPosition}px`;
                dropdown.style.right = 'auto';
                dropdown.style.transform = 'none';
                dropdown.style.zIndex = '10004';
              } else {
                // On desktop, reset to use CSS absolute positioning
                dropdown.style.position = '';
                dropdown.style.top = '';
                dropdown.style.left = '';
                dropdown.style.right = '';
                dropdown.style.transform = '';
                dropdown.style.zIndex = '';
              }
            }
          }
        });
      }
      return newState;
    });
  };
  const toggleMoreMenu = () => {
    setShowMoreMenu((prev) => {
      const newState = !prev;
      if (newState && moreMenuButtonRef.current && moreMenuDropdownRef.current) {
        // Position dropdown below the button, aligned with button
        requestAnimationFrame(() => {
          const button = moreMenuButtonRef.current;
          const dropdown = moreMenuDropdownRef.current;
          if (button && dropdown) {
            const buttonRect = button.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const dropdownWidth = 200; // Approximate dropdown width
            
            // Position dropdown below button, aligned with button's left edge
            let leftPosition = buttonRect.left + window.scrollX;
            
            // If dropdown goes off-screen to the right, shift it left
            if (leftPosition + dropdownWidth > viewportWidth - 8) {
              leftPosition = viewportWidth - dropdownWidth - 8;
            }
            
            // If dropdown goes off-screen to the left, shift it right
            if (leftPosition < 8) {
              leftPosition = 8;
            }
            
            dropdown.style.position = 'fixed';
            dropdown.style.top = `${buttonRect.bottom + window.scrollY + 8}px`;
            dropdown.style.left = `${leftPosition}px`;
            dropdown.style.transform = 'none';
            dropdown.style.right = 'auto';
          }
        });
      }
      return newState;
    });
  };

  const handleLogout = async () => {
    closeAllDropdowns();
    await logout();
    router.push('/login');
  };

  const toggleMoreUserMenu = () => {
    setShowMoreUserMenu((prev) => {
      const newState = !prev;
      if (newState && moreUserMenuButtonRef.current && moreUserMenuDropdownRef.current) {
        requestAnimationFrame(() => {
          const button = moreUserMenuButtonRef.current;
          const dropdown = moreUserMenuDropdownRef.current;
          if (button && dropdown) {
            const buttonRect = button.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const padding = 8; // Minimum padding from viewport edges
            
            // Use right positioning to ensure dropdown stays within viewport
            // Position dropdown so its right edge aligns with viewport right edge (with padding)
            // This guarantees it won't be cropped on the right side
            const rightPosition = padding;
            
            dropdown.style.position = 'fixed';
            dropdown.style.top = `${buttonRect.bottom + window.scrollY + 8}px`;
            dropdown.style.right = `${rightPosition}px`;
            dropdown.style.left = 'auto';
            dropdown.style.transform = 'none';
            dropdown.style.maxWidth = `${viewportWidth - (padding * 2)}px`;
            dropdown.style.width = 'auto';
          }
        });
      }
      return newState;
    });
  };

  // Detect mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate visible vs overflow user links (first row)
  useEffect(() => {
    const validUserLinks = (userLinks || []).filter((link): link is UserLink => 
      link != null && 'id' in link
    );

    if (!isMobile) {
      setVisibleUserLinks(validUserLinks);
      setOverflowUserLinks([]);
      return;
    }

    // On mobile, calculate overflow for first row user links
    const calculateUserLinksOverflow = () => {
      const row1 = row1Ref.current;
      const userLinksContainer = userLinksContainerRef.current;
      
      if (!row1 || !userLinksContainer || validUserLinks.length === 0) {
        setVisibleUserLinks(validUserLinks);
        setOverflowUserLinks([]);
        return;
      }

      const row1Rect = row1.getBoundingClientRect();
      // Find logo section by querying for the first child div
      const logoSection = row1.firstElementChild as HTMLElement;
      const logoWidth = logoSection ? logoSection.getBoundingClientRect().width + 8 : 0;
      const moreButtonWidth = 70; // Width for "More" button with padding
      const containerPadding = 16;
      const availableWidth = Math.max(0, row1Rect.width - logoWidth - moreButtonWidth - containerPadding);
      
      if (availableWidth <= 0) {
        // Not enough space, show all in overflow except maybe user
        const userLink = validUserLinks.find(l => l.id === 'user');
        const otherLinks = validUserLinks.filter(l => l.id !== 'user');
        setVisibleUserLinks(userLink ? [userLink] : []);
        setOverflowUserLinks(userLink ? otherLinks : validUserLinks);
        return;
      }
      
      let totalWidth = 0;
      const visible: UserLink[] = [];
      const overflow: UserLink[] = [];

      // Always try to show user first if available
      const userLink = validUserLinks.find(l => l.id === 'user');
      if (userLink) {
        const userRef = userLinkRefs.current[userLink.id];
        let userWidth = 0;
        if (userRef && userRef.offsetWidth > 0) {
          userWidth = userRef.offsetWidth + 4;
        } else {
          // Estimate width based on username length
          const usernameLength = (user || 'User').length;
          userWidth = Math.max(60, usernameLength * 8) + 40; // Rough estimate
        }
        if (userWidth <= availableWidth) {
          visible.push(userLink);
          totalWidth += userWidth;
        } else {
          overflow.push(userLink);
        }
      }

      // Measure remaining items
      for (const link of validUserLinks) {
        if (link.id === 'user') continue; // Already processed
        
        const linkRef = userLinkRefs.current[link.id];
        let linkWidth = 0;
        
        if (linkRef && linkRef.offsetWidth > 0) {
          linkWidth = linkRef.offsetWidth + 4;
        } else {
          // Estimate width based on label length
          const labelLength = (link.label || '').length;
          linkWidth = Math.max(50, labelLength * 7) + 30; // Rough estimate
        }
        
        if (totalWidth + linkWidth <= availableWidth) {
          visible.push(link);
          totalWidth += linkWidth;
        } else {
          // This item and all remaining items go to overflow
          overflow.push(...validUserLinks.filter(l => 
            l.id !== 'user' && !visible.find(v => v.id === l.id)
          ));
          break;
        }
      }

      // Ensure at least user is visible if we have items
      if (visible.length === 0 && validUserLinks.length > 0) {
        const firstLink = validUserLinks[0];
        visible.push(firstLink);
        overflow.splice(0, 1);
      }

      setVisibleUserLinks(visible);
      setOverflowUserLinks(overflow);
    };

    // Multiple attempts to ensure accurate measurement
    const attemptCalculation = (attempt = 0) => {
      if (attempt < 5) {
        calculateUserLinksOverflow();
        setTimeout(() => attemptCalculation(attempt + 1), 100 * (attempt + 1));
      }
    };

    // Initial calculation
    const rafId = requestAnimationFrame(() => {
      attemptCalculation();
    });

    // Also listen for resize
    window.addEventListener('resize', calculateUserLinksOverflow);
    
    // Use ResizeObserver for more accurate detection
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && row1Ref.current) {
      resizeObserver = new ResizeObserver(() => {
        calculateUserLinksOverflow();
      });
      resizeObserver.observe(row1Ref.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', calculateUserLinksOverflow);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isMobile, userLinks, user]);

  // Calculate visible vs overflow nav items on mobile
  useEffect(() => {
    // Filter out any undefined/null items
    const validNavItems = (navItems || []).filter((item): item is NavItem => 
      item != null && typeof item === 'object' && 'id' in item
    );

    if (!isMobile) {
      setVisibleNavItems(validNavItems);
      setOverflowNavItems([]);
      return;
    }

    // On mobile, start conservatively - show only first 2-3 items initially
    // This prevents all items from showing before calculation completes
    if (validNavItems.length > 3) {
      setVisibleNavItems(validNavItems.slice(0, 2));
      setOverflowNavItems(validNavItems.slice(2));
    } else {
      setVisibleNavItems(validNavItems);
      setOverflowNavItems([]);
    }

    const calculateOverflow = () => {
      const container = navContainerRef.current;
      const row2 = row2Ref.current;
      
      if (!container || validNavItems.length === 0) {
        // If container not ready or no items, show all items initially
        setVisibleNavItems(validNavItems);
        setOverflowNavItems([]);
        return;
      }

      if (!row2) {
        // If row2 not ready yet, show all items
        setVisibleNavItems(validNavItems);
        setOverflowNavItems([]);
        return;
      }

      const row2Rect = row2.getBoundingClientRect();
      
      // Find date/time element - look for span with suppressHydrationWarning or check all spans
      let dateTimeElement: HTMLElement | null = null;
      const spans = row2.querySelectorAll('span');
      for (const span of spans) {
        if (span.hasAttribute('suppressHydrationWarning') || span.textContent?.includes('A.M.') || span.textContent?.includes('P.M.')) {
          dateTimeElement = span as HTMLElement;
          break;
        }
      }
      
      const dateTimeWidth = dateTimeElement ? dateTimeElement.getBoundingClientRect().width + 12 : 0;
      const moreButtonWidth = 70; // Width for "More" button with padding
      const containerPadding = 16; // Padding on sides
      const availableWidth = Math.max(0, row2Rect.width - dateTimeWidth - moreButtonWidth - containerPadding);
      
      if (availableWidth <= 0) {
        // Not enough space, show all in overflow
        setVisibleNavItems([]);
        setOverflowNavItems(validNavItems);
        return;
      }
      
      let totalWidth = 0;
      const visible: NavItem[] = [];
      const overflow: NavItem[] = [];

      // Measure each item and determine what fits
      for (let i = 0; i < validNavItems.length; i++) {
        const item = validNavItems[i];
        if (!item || !item.id) {
          continue;
        }

        const itemRef = navItemsRefs.current[item.id];
        let itemWidth = 0;
        
        if (itemRef && itemRef.offsetWidth > 0) {
          itemWidth = itemRef.offsetWidth + 4; // Include gap
        } else {
          // Estimate width based on label length
          const labelLength = item.label?.length || 0;
          itemWidth = Math.max(50, labelLength * 7) + 20; // Rough estimate: ~7px per char + padding
        }
        
        if (totalWidth + itemWidth <= availableWidth) {
          visible.push(item);
          totalWidth += itemWidth;
        } else {
          // This item and all remaining items go to overflow
          overflow.push(...validNavItems.slice(i).filter((it): it is NavItem => it != null && 'id' in it));
          break;
        }
      }

      // Ensure at least one item is visible if we have items
      if (visible.length === 0 && validNavItems.length > 0) {
        visible.push(validNavItems[0]);
        if (overflow.length > 0) {
          overflow.shift();
        }
      }

      setVisibleNavItems(visible);
      setOverflowNavItems(overflow);
    };

    // Multiple attempts to ensure accurate measurement
    const attemptCalculation = (attempt = 0) => {
      if (attempt < 5) {
        calculateOverflow();
        // Try again after a delay to catch late-rendered items
        setTimeout(() => attemptCalculation(attempt + 1), 100 * (attempt + 1));
      }
    };

    // Initial calculation
    const rafId = requestAnimationFrame(() => {
      attemptCalculation();
    });

    // Also listen for resize
    window.addEventListener('resize', calculateOverflow);
    
    // Use ResizeObserver for more accurate detection
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && navContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        calculateOverflow();
      });
      resizeObserver.observe(navContainerRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', calculateOverflow);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isMobile, navItems]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdownId) {
        const ref = dropdownRefs.current[openDropdownId];
        const dropdownEl = dropdownElementRefs.current[openDropdownId];
        const target = e.target as Node;
        if (ref && dropdownEl && 
            !ref.contains(target) && 
            !dropdownEl.contains(target)) {
          closeAllDropdowns();
        }
      }
      if (showMoreMenu) {
        const moreButton = moreMenuButtonRef.current;
        const moreDropdown = moreMenuDropdownRef.current;
        const moreWrap = moreMenuRef.current;
        const target = e.target as Node;
        if (moreButton && moreWrap && 
            !moreButton.contains(target) && 
            !moreWrap.contains(target) &&
            (!moreDropdown || !moreDropdown.contains(target))) {
          setShowMoreMenu(false);
        }
      }
      if (showMoreUserMenu) {
        const moreButton = moreUserMenuButtonRef.current;
        const moreDropdown = moreUserMenuDropdownRef.current;
        const moreWrap = moreUserMenuRef.current;
        const target = e.target as Node;
        if (moreButton && moreWrap && 
            !moreButton.contains(target) && 
            !moreWrap.contains(target) &&
            (!moreDropdown || !moreDropdown.contains(target))) {
          setShowMoreUserMenu(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId, showMoreMenu, showMoreUserMenu]);

  const getDropdownItems = (dropdownId: string | null): DropdownItem[] => {
    if (dropdownId === 'user') return USER_DROPDOWN_ITEMS;
    if (dropdownId === 'request-access') return REQUEST_ACCESS_DROPDOWN_ITEMS;
    if (dropdownId === 'support') return SUPPORT_DROPDOWN_ITEMS;
    return [];
  };

  return (
    <header className={styles.header} role="banner">
      <div className={styles.headerRow1} ref={row1Ref}>
        <div className={styles.logoSection}>
          {/* Mobile menu toggle button */}
          <button
            type="button"
            className={styles.mobileMenuToggle}
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar-menu"
          >
            <i className="bi bi-list" aria-hidden="true" />
          </button>
          <a href={logoHref} className={styles.logo} aria-label="Home - HRSA PPRS Community Development">{logoText}</a>
        </div>
        <div className={styles.headerUserLinks} ref={userLinksContainerRef}>
          {visibleUserLinks.filter((link): link is UserLink => link != null && 'id' in link).map((link) => {
            if (!link || !link.id) return null;
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
                  aria-label="Logout"
                  ref={(el) => { if (link.id) userLinkRefs.current[link.id] = el; }}
                >
                  {link.label}
                </button>
                );
              }
              return (
                <a 
                  key={link.id} 
                  href={link.href} 
                  className={styles.headerUserItem}
                  ref={(el) => { if (link.id) userLinkRefs.current[link.id] = el; }}
                >
                  {link.label}
                </a>
              );
            }

            return (
              <div
                key={link.id}
                className={`${styles.headerDropdownWrap} ${isOpen ? styles.headerDropdownOpen : ''}`}
                ref={(el) => { 
                  if (dropdownId) dropdownRefs.current[dropdownId] = el; 
                  if (link.id) userLinkRefs.current[link.id] = el;
                }}
              >
                <button
                  type="button"
                  className={styles.headerUserItem}
                  onClick={() => toggleDropdown(dropdownId)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  aria-label={`${link.label} menu`}
                  aria-controls={`dropdown-${dropdownId}`}
                >
                  {triggerLabel}
                  <i className="bi bi-chevron-down" aria-hidden="true" />
                </button>
                {isOpen && (
                  <div 
                    className={styles.headerDropdown}
                    id={`dropdown-${dropdownId}`}
                    role="menu"
                    aria-label={`${link.label} submenu`}
                    ref={(el) => { if (dropdownId) dropdownElementRefs.current[dropdownId] = el; }}
                  >
                    {items.map((item, index) => (
                      <div key={item.id}>
                        {index > 0 && <div className={styles.headerDropdownSeparator} role="separator" />}
                        <a 
                          href={item.href} 
                          className={styles.headerDropdownItem}
                          role="menuitem"
                          aria-label={item.label}
                        >
                          {item.label}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {isMobile && overflowUserLinks.length > 0 && (
            <div 
              className={styles.moreUserMenuWrap}
              ref={moreUserMenuRef}
            >
              <button
                type="button"
                ref={moreUserMenuButtonRef}
                className={`${styles.moreUserMenuButton} ${showMoreUserMenu ? styles.moreUserMenuButtonOpen : ''}`}
                onClick={toggleMoreUserMenu}
                aria-label="More user options"
                aria-expanded={showMoreUserMenu}
                aria-haspopup="true"
              >
                <i className="bi bi-three-dots" aria-hidden="true" />
                <span className={styles.moreUserMenuLabel}>More</span>
              </button>
              {showMoreUserMenu && overflowUserLinks.length > 0 && (
                <div 
                  ref={moreUserMenuDropdownRef}
                  className={styles.moreUserMenuDropdown} 
                  role="menu" 
                  aria-label="More user options"
                >
                  {overflowUserLinks.filter((link): link is UserLink => link != null && 'id' in link).map((link) => {
                    if (!link || !link.id) return null;
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
                            className={styles.moreUserMenuItem}
                            role="menuitem"
                            aria-label="Logout"
                          >
                            {link.label}
                          </button>
                        );
                      }
                      return (
                        <a 
                          key={link.id} 
                          href={link.href} 
                          className={styles.moreUserMenuItem}
                          role="menuitem"
                          onClick={() => setShowMoreUserMenu(false)}
                        >
                          {link.label}
                        </a>
                      );
                    }

                    // For dropdown items in overflow menu, show the dropdown items directly
                    return (
                      <div key={link.id}>
                        {items.map((item, index) => (
                          <div key={item.id}>
                            {index > 0 && <div className={styles.headerDropdownSeparator} role="separator" />}
                            <a 
                              href={item.href} 
                              className={styles.moreUserMenuItem}
                              role="menuitem"
                              aria-label={item.label}
                              onClick={() => setShowMoreUserMenu(false)}
                            >
                              {item.label}
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {((navItems && navItems.length > 0) || showDateTime) && (
        <div className={styles.headerRow2} ref={row2Ref}>
          <nav className={styles.headerNav} aria-label="Main navigation">
            <ul className={styles.mainNav} ref={navContainerRef} role="menubar">
              {visibleNavItems.filter((item): item is NavItem => item != null && 'id' in item).map((item) => {
                if (!item || !item.id) return null;
                const href = item.id === 'home' ? '/welcome' : (item.href || '#');
                const isInternal = href.startsWith('/');
                const className = item.id === activeNavItem ? styles.navItemActive : undefined;
                return (
                  <li 
                    key={item.id} 
                    className={styles.navItem} 
                    role="none"
                    ref={(el) => { if (item.id) navItemsRefs.current[item.id] = el; }}
                  >
                    {isInternal ? (
                      <Link href={href} className={className} role="menuitem" aria-label={`Navigate to ${item.label}`}>
                        {item.label}
                      </Link>
                    ) : (
                      <a href={href} className={className} role="menuitem" aria-label={`Navigate to ${item.label}`}>
                        {item.label}
                      </a>
                    )}
                  </li>
                );
              })}
              {isMobile && (
                <li 
                  className={styles.navItem} 
                  role="none" 
                  ref={moreMenuRef}
                  style={{ display: overflowNavItems.length > 0 ? 'block' : 'none' }}
                >
                  <div className={styles.moreMenuWrap}>
                    <button
                      type="button"
                      ref={moreMenuButtonRef}
                      className={`${styles.moreMenuButton} ${showMoreMenu ? styles.moreMenuButtonOpen : ''}`}
                      onClick={toggleMoreMenu}
                      aria-label="More navigation options"
                      aria-expanded={showMoreMenu}
                      aria-haspopup="true"
                    >
                      <i className="bi bi-three-dots" aria-hidden="true" />
                      <span className={styles.moreMenuLabel}>More</span>
                    </button>
                    {showMoreMenu && overflowNavItems.length > 0 && (
                      <div 
                        ref={moreMenuDropdownRef}
                        className={styles.moreMenuDropdown} 
                        role="menu" 
                        aria-label="More navigation options"
                      >
                        {overflowNavItems.filter((item): item is NavItem => item != null && 'id' in item).map((item) => {
                          if (!item || !item.id) return null;
                          const href = item.id === 'home' ? '/welcome' : (item.href || '#');
                          const isInternal = href.startsWith('/');
                          const className = item.id === activeNavItem ? styles.moreMenuItemActive : undefined;
                          return (
                            <div key={item.id}>
                              {isInternal ? (
                                <Link 
                                  href={href} 
                                  className={`${styles.moreMenuItem} ${className || ''}`}
                                  role="menuitem"
                                  onClick={() => setShowMoreMenu(false)}
                                >
                                  {item.label}
                                </Link>
                              ) : (
                                <a 
                                  href={href} 
                                  className={`${styles.moreMenuItem} ${className || ''}`}
                                  role="menuitem"
                                  onClick={() => setShowMoreMenu(false)}
                                >
                                  {item.label}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </li>
              )}
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
