'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DataGrid from '../DataGrid';
import styles from './SiteVisitPlanStatusOverview.module.css';

const SECTION_COLUMNS = [
  { key: 'name', label: 'Section', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const SECTION_ACTIONS = [
  { id: 'update', label: 'Update', iconLeft: 'bi-pencil-square', category: 'Action' },
];

export default function SiteVisitPlanStatusOverview({ plan, showSuccessBanner }) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);
  const [visibleBanner, setVisibleBanner] = useState(showSuccessBanner);

  useEffect(() => {
    if (!showSuccessBanner) {
      setVisibleBanner(false);
      return;
    }
    setVisibleBanner(true);
    const t = setTimeout(() => setVisibleBanner(false), 5000);
    return () => clearTimeout(t);
  }, [showSuccessBanner]);

  const planTitle = plan.plan_code
    ? `${plan.plan_code}: ${plan.plan_name || ''}`
    : `Plan ${plan.id}: ${plan.plan_name || ''}`;
  const sections = useMemo(
    () => (plan.sections || []).map((s) => ({ ...s, status: s.status || 'Not Started' })),
    [plan.sections]
  );

  const handleSectionAction = (action, row) => {
    if (action.id === 'update') {
      // Placeholder: could navigate to section edit or open a modal
    }
  };

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
        actions={SECTION_ACTIONS}
        actionButtonLabel="Update"
        onRowAction={handleSectionAction}
        showFilters={false}
        defaultPageSize={10}
      />

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <Link href="/svp">Return to List</Link>
        </div>
        <div className={styles.footerRight}>
          <button type="button">Cancel Plan</button>
          <button type="button">Request Approval</button>
        </div>
      </div>
    </div>
  );
}
