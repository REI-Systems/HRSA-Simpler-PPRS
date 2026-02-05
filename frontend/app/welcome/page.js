'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/Layout';
import WelcomePageContent from '../components/Welcome';
import { getMenu, getHeaderNav, getPlans, getWelcomeMessage, getStoredUsername } from '../services';

export default function WelcomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [navItems, setNavItems] = useState([]);
  const [plans, setPlans] = useState([]);
  const [welcomeMessage, setWelcomeMessage] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getMenu(),
      getHeaderNav(),
      getPlans(typeof window !== 'undefined' ? getStoredUsername() : null),
      getWelcomeMessage().catch(() => null),
    ])
      .then(([menu, nav, plansData, welcome]) => {
        setMenuItems(menu);
        setNavItems(nav);
        setPlans(plansData ?? []);
        setWelcomeMessage(welcome);
      })
      .catch((err) => {
        setError(err?.message ?? 'Failed to load.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AppLayout
      menuItems={menuItems}
      navItems={navItems.length > 0 ? navItems : undefined}
      activeNavItem="home"
      defaultExpandedMenuIds={['svp']}
    >
      <WelcomePageContent
        plans={plans}
        welcomeMessage={welcomeMessage}
        loading={loading}
        error={error}
      />
    </AppLayout>
  );
}
