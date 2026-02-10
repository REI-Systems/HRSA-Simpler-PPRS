'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import DataGrid from '../../../core/DataGrid';
import { getPlanById, cancelPlan, completePlan } from '../../../../services';
import ConfirmModal from '../../../core/ConfirmModal';
import styles from './SiteVisitPlanStatusOverview.module.css';

const SECTION_COLUMNS = [
  { key: 'name', label: 'Section', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const SECTION_ACTION_VIEW = [
  { id: 'view', label: 'View', iconLeft: 'bi-eye', category: 'Action' },
];
const SECTION_ACTION_UPDATE = [
  { id: 'update', label: 'Update', iconLeft: 'bi-pencil-square', category: 'Action' },
];

export default function SiteVisitPlanStatusOverview({ planId, showSuccessBanner, viewMode = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);
  const [visibleBanner, setVisibleBanner] = useState(showSuccessBanner);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const fetchPlan = useCallback(() => {
    if (!planId) {
      setError('Plan ID is missing');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getPlanById(planId)
      .then(setPlan)
      .catch((err) => {
        setError(err.status === 404 ? 'Plan not found.' : err.message || 'Failed to load plan.');
      })
      .finally(() => setLoading(false));
  }, [planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Refetch when navigating back to this page (pathname changes to status overview)
  // Match pattern: /svp/status/[id] but not /svp/status/[id]/coversheet, etc.
  useEffect(() => {
    if (pathname && planId) {
      // Check if we're on the status overview page (not a sub-page)
      const statusOverviewPattern = new RegExp(`^/svp/status/${planId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/)?$`);
      if (statusOverviewPattern.test(pathname)) {
        fetchPlan();
      }
    }
  }, [pathname, planId, fetchPlan]);

  // Refetch when user returns to this tab so grid stays in sync after editing elsewhere
  useEffect(() => {
    const onFocus = () => {
      if (planId) fetchPlan();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [planId, fetchPlan]);

  // Also refresh when page becomes visible (handles browser back/forward navigation)
  useEffect(() => {
    if (!planId) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPlan();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [planId, fetchPlan]);

  useEffect(() => {
    if (!showSuccessBanner) {
      setVisibleBanner(false);
      return;
    }
    setVisibleBanner(true);
    const t = setTimeout(() => setVisibleBanner(false), 5000);
    return () => clearTimeout(t);
  }, [showSuccessBanner]);

  const planTitle = plan
    ? (plan.plan_code
        ? `${plan.plan_code}: ${plan.plan_name || ''}`
        : `Plan ${plan.id}: ${plan.plan_name || ''}`)
    : '';
  const sections = useMemo(
    () => (plan?.sections || []).map((s) => ({ ...s, status: s.status || 'Not Started' })),
    [plan?.sections]
  );

  const allSectionsComplete = useMemo(
    () => sections.length > 0 && sections.every((s) => (s.status || 'Not Started') === 'Complete'),
    [sections]
  );
  const canCompletePlan = allSectionsComplete && plan?.status !== 'Complete';

  const handleCancelPlanClick = useCallback(() => {
    if (planId) setShowCancelConfirm(true);
  }, [planId]);

  const handleCancelPlanConfirm = useCallback(() => {
    if (!planId) return;
    setCancelError(null);
    setCancelling(true);
    setShowCancelConfirm(false);
    cancelPlan(planId)
      .then(() => {
        router.push('/svp');
      })
      .catch((err) => {
        setCancelError(err.message || 'Failed to cancel plan.');
      })
      .finally(() => {
        setCancelling(false);
      });
  }, [planId, router]);

  const handleCancelPlanClose = useCallback(() => {
    if (!cancelling) setShowCancelConfirm(false);
  }, [cancelling]);

  const handleCompletePlanClick = useCallback(() => {
    if (planId && canCompletePlan) setShowCompleteConfirm(true);
  }, [planId, canCompletePlan]);

  const handleCompletePlanConfirm = useCallback(() => {
    if (!planId) return;
    setCompleteError(null);
    setCompleting(true);
    setShowCompleteConfirm(false);
    completePlan(planId)
      .then((updated) => {
        setPlan(updated);
        setCompleteError(null);
      })
      .catch((err) => {
        const msg = err.message || 'Failed to complete plan.';
        const incomplete = err.incomplete_sections;
        setCompleteError(
          incomplete?.length
            ? `${msg} Complete these sections: ${incomplete.join(', ')}.`
            : msg
        );
      })
      .finally(() => {
        setCompleting(false);
      });
  }, [planId]);

  const handleCompletePlanClose = useCallback(() => {
    if (!completing) setShowCompleteConfirm(false);
  }, [completing]);

  const viewQuery = viewMode ? '?view=true' : '';
  const sectionActions = viewMode ? SECTION_ACTION_VIEW : SECTION_ACTION_UPDATE;
  const handleSectionAction = (action, row) => {
    const isView = action.id === 'view';
    const isUpdate = action.id === 'update';
    if (!planId || (!isView && !isUpdate)) return;
    const query = isView ? viewQuery : '';
    if (row?.id === 'cover_sheet') {
      router.push(`/svp/status/${encodeURIComponent(planId)}/coversheet${query}`);
    } else if (row?.id === 'selected_entities') {
      router.push(`/svp/status/${encodeURIComponent(planId)}/selected-entities${query}`);
    } else if (row?.id === 'identified_site_visits') {
      router.push(`/svp/status/${encodeURIComponent(planId)}/identified-site-visits${query}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error} role="alert">Error: {error}</p>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>
        <i className="bi bi-clipboard" aria-hidden />
        Site Visit Plan - Status Overview
      </h1>

      {visibleBanner && (
        <div className={styles.successBanner} role="alert">
          <i className="bi bi-check-circle-fill" aria-hidden />
          Success: Plan created successfully.
        </div>
      )}

      {!viewMode && !allSectionsComplete && plan?.status !== 'Complete' && (
        <div className={styles.noteBanner} role="status">
          <i className="bi bi-info-circle-fill" aria-hidden />
          Complete all sections (Cover Sheet, Selected Entities, Identified Site Visits) to enable Complete Plan.
        </div>
      )}

      <div className={styles.collapsible}>
        <button
          type="button"
          className={styles.collapsibleHeader}
          onClick={() => setDetailsOpen(!detailsOpen)}
          aria-expanded={detailsOpen}
        >
          <span className={styles.collapsibleHeaderLeft}>
            <i
              className={`bi bi-chevron-down ${styles.collapsibleChevron} ${detailsOpen ? styles.open : ''}`}
              aria-hidden
            />
            {planTitle}
          </span>
          <span className={styles.collapsibleHeaderRight}>
            Status: {plan.status || 'In Progress'}
          </span>
        </button>
        <div
          className={`${styles.collapsibleBodyWrapper} ${detailsOpen ? styles.collapsibleBodyOpen : ''}`}
          aria-hidden={!detailsOpen}
        >
          <div className={styles.collapsibleBody}>
            <div className={styles.detailRow}>
              <span className={styles.detailItem}>
                <strong>Plan For:</strong> {plan.plan_for || '—'}
              </span>
              <span className={styles.detailItem}>
                <strong>Plan Period:</strong> {plan.plan_period || '—'}
              </span>
              <span className={styles.detailItem}>
                <strong>Number of Site Visits:</strong> {plan.site_visits ?? '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.collapsible}>
        <button
          type="button"
          className={styles.collapsibleHeader}
          onClick={() => setResourcesOpen(!resourcesOpen)}
          aria-expanded={resourcesOpen}
        >
          <span className={styles.collapsibleHeaderLeft}>
            <i className="bi bi-box-arrow-up-right" aria-hidden />
            Resources
            <i
              className={`bi bi-chevron-down ${styles.collapsibleChevron} ${resourcesOpen ? styles.open : ''}`}
              aria-hidden
            />
          </span>
        </button>
        <div
          className={`${styles.collapsibleBodyWrapper} ${resourcesOpen ? styles.collapsibleBodyOpen : ''}`}
          aria-hidden={!resourcesOpen}
        >
          <div className={styles.collapsibleBody}>
            <h3 className={styles.currentDocumentsTitle}>Current Documents</h3>
            <div className={styles.detailRowSecond}>
              <a href="#view-plan">View Plan</a>
              <span className={styles.detailRowSeparator} aria-hidden />
              <a href="#program-plan">Program Plan</a>
              <span className={styles.detailRowSeparator} aria-hidden />
              <a href="#view-contributions">View Contributions</a>
            </div>
          </div>
        </div>
      </div>

      <h2 className={styles.sectionHeader}>Plan Section Status</h2>
      <DataGrid
        columns={SECTION_COLUMNS}
        data={sections}
        actions={sectionActions}
        actionButtonLabel={viewMode ? 'View' : 'Update'}
        onRowAction={handleSectionAction}
        showFilters={false}
        defaultPageSize={10}
      />

      {cancelError && (
        <p className={styles.error} role="alert">
          {cancelError}
        </p>
      )}
      {completeError && (
        <p className={styles.error} role="alert">
          {completeError}
        </p>
      )}
      <ConfirmModal
        open={showCancelConfirm}
        title="Cancel Plan"
        message="Are you sure you want to cancel this plan? The plan status will be set to Cancelled and the plan will be retained."
        confirmLabel="Cancel Plan"
        cancelLabel="Keep Plan"
        confirmVariant="danger"
        confirmDisabled={cancelling}
        onConfirm={handleCancelPlanConfirm}
        onCancel={handleCancelPlanClose}
      />
      <ConfirmModal
        open={showCompleteConfirm}
        title="Complete Plan"
        message="Are you sure you want to mark this plan as complete? The plan status will be updated to Complete."
        confirmLabel="Complete Plan"
        cancelLabel="Cancel"
        confirmDisabled={completing}
        onConfirm={handleCompletePlanConfirm}
        onCancel={handleCompletePlanClose}
      />
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <Link href="/svp">Return to List</Link>
        </div>
        {!viewMode && (
          <div className={styles.footerRight}>
            <button
              type="button"
              onClick={handleCancelPlanClick}
              disabled={cancelling}
              aria-busy={cancelling}
            >
              {cancelling ? 'Cancelling…' : 'Cancel Plan'}
            </button>
            <button
              type="button"
              onClick={handleCompletePlanClick}
              disabled={completing || !canCompletePlan}
              aria-busy={completing}
              title={!allSectionsComplete && plan?.status !== 'Complete' ? 'Complete all sections first' : undefined}
            >
              {completing ? 'Completing…' : 'Complete Plan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
