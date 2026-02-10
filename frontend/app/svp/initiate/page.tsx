'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/Layout';
import InitiatePlanForm from '../../components/InitiatePlanForm';
import { getMenu, getHeaderNav, getInitiateOptions, createPlan } from '../../services';
import type { MenuItem } from '../../services/menuService';

export default function SiteVisitPlanInitiatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [navItems, setNavItems] = useState<Array<{ id: string; label: string; href: string }>>([]);
  const [options, setOptions] = useState<Record<string, unknown>>({});

  useEffect(() => {
    Promise.all([getMenu(), getHeaderNav(), getInitiateOptions()])
      .then(([menu, nav, opts]) => {
        setMenuItems(menu);
        setNavItems(nav);
        setOptions((opts as Record<string, unknown>) ?? {});
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (formData: Record<string, unknown>) => {
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
      const created = (await createPlan(payload)) as { id?: string } | null;
      if (created?.id != null) {
        router.push('/svp/status/' + encodeURIComponent(created.id) + '?created=1');
      } else {
        setSubmitError('Plan was not created. The server did not return a plan id.');
      }
    } catch (err) {
      setSubmitError((err as Error).message || 'Failed to create plan.');
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
