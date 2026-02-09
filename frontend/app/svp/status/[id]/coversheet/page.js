'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import AppLayout from '../../../../components/Layout';
import SiteVisitPlanCoversheet from '../../../../components/SiteVisitPlanCoversheet';
import { getMenu, getHeaderNav, getPlanById } from '../../../../services';
import styles from '../../../../components/SiteVisitPlanList/SiteVisitPlanList.module.css';

export default function SiteVisitPlanCoversheetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id;
  const viewMode = searchParams?.get('view') === 'true';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [navItems, setNavItems] = useState([]);

  const loadPlan = () => {
    if (!id) return Promise.resolve();
    return getPlanById(id)
      .then((planData) => {
        setPlan(planData);
        setError(null);
      })
      .catch((err) => {
        setError(err.status === 404 ? 'Plan not found.' : err.message || 'Failed to load plan.');
      });
  };

  useEffect(() => {
    if (!id) {
      setError('Plan ID is missing');
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getMenu(), getHeaderNav(), getPlanById(id)])
      .then(([menu, nav, planData]) => {
        setMenuItems(menu);
        setNavItems(nav.length > 0 ? nav : undefined);
        setPlan(planData);
      })
      .catch((err) => {
        setError(err.status === 404 ? 'Plan not found.' : err.message || 'Failed to load plan.');
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
  ) : plan ? (
    <SiteVisitPlanCoversheet key={plan.id} plan={plan} onSaveSuccess={loadPlan} readOnly={viewMode} />
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
