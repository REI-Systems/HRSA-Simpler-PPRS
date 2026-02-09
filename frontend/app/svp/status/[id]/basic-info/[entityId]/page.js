'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import AppLayout from '../../../../../components/Layout';
import SiteVisitPlanBasicInfo from '../../../../../components/SiteVisitPlanBasicInfo';
import { getMenu, getHeaderNav } from '../../../../../services';
import { getPlanById, getBasicInfo, getBasicInfoOptions } from '../../../../../services/svpService';
import styles from '../../../../../components/SiteVisitPlanList/SiteVisitPlanList.module.css';

export default function BasicInfoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id;
  const entityId = params?.entityId;
  const viewMode = searchParams?.get('view') === 'true';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [basicInfo, setBasicInfo] = useState(null);
  const [options, setOptions] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [navItems, setNavItems] = useState([]);
  const [formKey, setFormKey] = useState(0);

  const loadData = () => {
    if (!id || !entityId) return Promise.resolve();
    return Promise.all([
      getPlanById(id),
      getBasicInfo(id, entityId),
      getBasicInfoOptions(),
    ])
      .then(([planData, basicInfoData, optionsData]) => {
        setPlan(planData);
        setBasicInfo(basicInfoData);
        setOptions(optionsData || {});
        setError(null);
      })
      .catch((err) => {
        setError(err.status === 404 ? 'Plan or entity not found.' : err.message || 'Failed to load basic information.');
      });
  };

  useEffect(() => {
    if (!id || !entityId) {
      setError('Plan ID or Entity ID is missing');
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getMenu(), getHeaderNav(), getPlanById(id), getBasicInfo(id, entityId), getBasicInfoOptions()])
      .then(([menu, nav, planData, basicInfoData, optionsData]) => {
        setMenuItems(menu);
        setNavItems(nav.length > 0 ? nav : undefined);
        setPlan(planData);
        setBasicInfo(basicInfoData);
        setOptions(optionsData || {});
      })
      .catch((err) => {
        setError(err.status === 404 ? 'Plan or entity not found.' : err.message || 'Failed to load basic information.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, entityId]);

  const content = loading ? (
    <div className={styles.loadingWrap}>
      <p>Loading...</p>
    </div>
  ) : error ? (
    <div className={styles.errorWrap}>
      <p className={styles.error}>Error: {error}</p>
    </div>
  ) : plan && basicInfo && options ? (
    <SiteVisitPlanBasicInfo
      key={formKey}
      planId={plan.id ?? id}
      entityId={basicInfo?.entity?.id ?? entityId}
      plan={plan}
      basicInfo={basicInfo}
      options={options}
      onSaveSuccess={() => loadData().then(() => setFormKey((k) => k + 1))}
      viewMode={viewMode}
    />
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
