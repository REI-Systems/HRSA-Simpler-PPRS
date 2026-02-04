'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/Layout';
import InitiatePlanForm from '../../components/InitiatePlanForm';
import { getMenu, getHeaderNav, getInitiateOptions, createPlan } from '../../services';

export default function SiteVisitPlanInitiatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [navItems, setNavItems] = useState([]);
  const [options, setOptions] = useState({});

  useEffect(() => {
    Promise.all([getMenu(), getHeaderNav(), getInitiateOptions()])
      .then(([menu, nav, opts]) => {
        setMenuItems(menu);
        setNavItems(nav);
        setOptions(opts);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (formData) => {
    setSubmitError(null);
    const payload = {
      team: formData.team,
      planForType: formData.planForType,
      bureau: formData.bureau,
      division: formData.division,
      program: formData.program,
      periodType: formData.periodType,
      fiscalYear: formData.fiscalYear,
      calendarYear: formData.calendarYear,
      planName: formData.planName,
    };
    try {
      const created = await createPlan(payload);
      if (created?.id != null) {
        router.push('/svp/status/' + encodeURIComponent(created.id) + '?created=1');
      } else {
        setSubmitError('Plan was not created. The server did not return a plan id.');
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to create plan.');
    }
  };

  const content = loading ? (
    <div style={{ padding: '24px' }}>
      <p>Loading...</p>
    </div>
  ) : error ? (
    <div style={{ padding: '24px' }}>
      <p style={{ color: '#c00' }}>Error: {error}. Make sure the backend is running.</p>
    </div>
  ) : (
    <>
      {submitError && (
        <div style={{ padding: '12px 20px', marginBottom: '16px', background: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24' }}>
          {submitError}
        </div>
      )}
      <InitiatePlanForm options={options} onSubmit={handleSubmit} onCancel={() => router.push('/svp')} />
    </>
  );

  return (
    <AppLayout
      menuItems={menuItems}
      navItems={navItems.length > 0 ? navItems : undefined}
      activeNavItem="tasks"
      defaultExpandedMenuIds={['svp']}
    >
      {content}
    </AppLayout>
  );
}
