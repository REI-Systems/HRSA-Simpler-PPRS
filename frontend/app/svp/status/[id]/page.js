'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import AppLayout from '../../../components/Layout';
import SiteVisitPlanStatusOverview from '../../../components/SiteVisitPlanStatusOverview';
import { getMenu, getHeaderNav, recordPlanAccess } from '../../../services';
import styles from '../../../components/SiteVisitPlanList/SiteVisitPlanList.module.css';

export default function SiteVisitPlanStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [navItems, setNavItems] = useState([]);

  const showSuccessBanner = searchParams?.get('created') === '1';
  const viewMode = searchParams?.get('view') === 'true';

  useEffect(() => {
    if (id) recordPlanAccess(id);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError('Plan ID is missing');
      setLoading(false);
      return;
    }
    Promise.all([getMenu(), getHeaderNav()])
      .then(([menu, nav]) => {
        setMenuItems(menu);
        setNavItems(nav.length > 0 ? nav : undefined);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load layout.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const content = loading ? (
    <div className={styles.loadingWrap}>
      <p>Loading...</p>
    </div>
  ) : error ? (
    <div className={styles.errorWrap}>
      <p className={styles.error}>Error: {error}</p>
    </div>
  ) : id ? (
    <SiteVisitPlanStatusOverview planId={id} showSuccessBanner={showSuccessBanner} viewMode={viewMode} />
  ) : null;

  return (
    <AppLayout
      menuItems={menuItems}
      navItems={navItems}
      activeNavItem="tasks"
      defaultExpandedMenuIds={['svp']}
    >
      {content}
    </AppLayout>
  );
}
