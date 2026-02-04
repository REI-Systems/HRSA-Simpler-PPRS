'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DataGrid from '../DataGrid';
import AddGrantsModal from '../AddGrantsModal';
import {
  getPlanEntities,
  getAvailableEntities,
  addEntityToPlan,
  removeEntityFromPlan,
  updatePlanSectionStatus,
} from '../../services/svpService';
import overviewStyles from '../SiteVisitPlanStatusOverview/SiteVisitPlanStatusOverview.module.css';
import styles from './SelectedEntities.module.css';

const ACTION_REMOVE_ENTITIES = 'remove_entities';
const ACTION_CONTINUE = 'continue';
const ACTION_MARK_COMPLETE = 'mark_complete';

// Grid columns configuration with minWidth for even spacing and readability
const ENTITY_COLUMNS = [
  { key: 'entity_number', label: 'Entity Number', sortable: true, filterable: true, minWidth: 115 },
  { key: 'entity_name', label: 'Entity Name', sortable: true, filterable: true, minWidth: 220 },
  { key: 'city', label: 'City', sortable: true, filterable: true, minWidth: 100 },
  { key: 'state', label: 'State', sortable: true, filterable: true, filterType: 'select', filterOptions: ['All', 'TX', 'IL', 'CA', 'NY', 'FL'], minWidth: 55 },
  { key: 'midpoint_current_pp', label: 'Mid-point of Current PP', sortable: true, filterable: true, minWidth: 130 },
  { key: 'active_grant_no_site_visit', label: 'Active Grant with no site visit in Current PP and Mid-point of PP is approaching', sortable: true, filterable: true, filterType: 'select', filterOptions: ['All', 'Yes', 'No'], minWidth: 180 },
  { key: 'active_grant_1_year_pp', label: 'Active Grant with 1 year PP', sortable: true, filterable: true, filterType: 'select', filterOptions: ['All', 'Yes', 'No'], minWidth: 140 },
  { key: 'active_new_grant', label: 'Active New Grant/Newly Funded', sortable: true, filterable: true, filterType: 'select', filterOptions: ['All', 'Yes', 'No'], minWidth: 160 },
  { key: 'status', label: 'Status', sortable: true, filterable: true, filterType: 'select', filterOptions: ['All', 'Approved by APO', 'Not in Plan'], minWidth: 120 },
  { key: 'recent_site_visit_dates', label: 'Recent Site Visit Dates (SV Type)', sortable: true, filterable: true, minWidth: 220 },
];

// Row actions: only "Remove" for entities already on the Selected Entities grid (added via Add Grants)
const ENTITY_ACTIONS = [
  { id: 'remove', label: 'Remove', category: 'Action', iconLeft: 'bi-x-lg' },
];

export default function SelectedEntities({ plan, onSaveSuccess }) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [saveStatus, setSaveStatus] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [actionMessage, setActionMessage] = useState(null);
  const [addGrantsModalOpen, setAddGrantsModalOpen] = useState(false);

  useEffect(() => {
    if (!plan?.id) return;
    loadEntities();
  }, [plan?.id]);

  useEffect(() => {
    if (saveStatus === 'saving') {
      window.scrollTo(0, 0);
    }
  }, [saveStatus]);

  const loadEntities = async () => {
    if (!plan?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPlanEntities(plan.id);
      setEntities(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load entities:', err);
      setEntities([]);
      
      // Set user-friendly error message
      if (err.isNetworkError || err.status === 0) {
        setError('Unable to connect to server. Please check if the backend server is running.');
      } else if (err.status === 404) {
        setError('Plan not found. Please refresh the page.');
      } else {
        setError(err.message || 'Failed to load entities. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRowAction = async (action, row) => {
    if (action.id === 'remove') {
      try {
        setSaveStatus('saving');
        setError(null);
        await removeEntityFromPlan(plan.id, row.id);
        await loadEntities();
        await onSaveSuccess?.();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (err) {
        console.error('Failed to remove entity from plan:', err);
        setSaveStatus('error');
        if (err.isNetworkError || err.status === 0) {
          setError('Unable to connect to server. Please check if the backend server is running.');
        } else if (err.status === 404) {
          setError('Entity or plan not found. Please refresh the page.');
        } else {
          setError(err.message || 'Failed to remove entity. Please try again.');
        }
        setTimeout(() => {
          setSaveStatus(null);
          setError(null);
        }, 5000);
      }
    }
  };

  const handleSelectionChange = (newSelected) => {
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (action) => {
    if (action === 'select') {
      const allIds = new Set(entities.map((e) => String(e.id)));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleViewSelected = (selectedIds) => {
    console.log('View selected entities:', selectedIds);
    // TODO: Implement view selected functionality
  };

  const handleAddGrants = () => {
    setAddGrantsModalOpen(true);
  };

  const handleAddGrantsModalClose = () => {
    setAddGrantsModalOpen(false);
  };

  const handleAddGrantsModalAdd = async (selectedEntityIds) => {
    try {
      setSaveStatus('saving');
      setError(null);
      for (const entityId of selectedEntityIds) {
        await addEntityToPlan(plan.id, entityId);
      }
      await loadEntities();
      await onSaveSuccess?.();
      setAddGrantsModalOpen(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Failed to add entities:', err);
      setSaveStatus('error');
      if (err.isNetworkError || err.status === 0) {
        setError('Unable to connect to server. Please check if the backend server is running.');
      } else if (err.status === 404) {
        setError('Plan not found. Please refresh the page.');
      } else {
        setError(err.message || 'Failed to add entities. Please try again.');
      }
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 5000);
    }
  };

  const handleGoAction = async () => {
    if (!selectedAction) return;
    const action = selectedAction;
    setActionMessage(null);
    setSaveStatus('saving');
    setError(null);
    try {
      if (action === ACTION_REMOVE_ENTITIES) {
        const ids = Array.from(selectedRows);
        if (ids.length === 0) {
          setError('Please select one or more entities to remove.');
          setSaveStatus(null);
          return;
        }
        for (const entityId of ids) {
          await removeEntityFromPlan(plan.id, entityId);
        }
        setSelectedRows(new Set());
        await loadEntities();
        await onSaveSuccess?.();
        setActionMessage(`${ids.length} entit${ids.length === 1 ? 'y' : 'ies'} removed.`);
      } else if (action === ACTION_CONTINUE) {
        setSaveStatus(null);
        setSelectedAction('');
        router.push(`/svp/status/${plan.id}`);
        return;
      } else if (action === ACTION_MARK_COMPLETE) {
        await updatePlanSectionStatus(plan.id, 'selected_entities', 'Complete');
        await onSaveSuccess?.();
        setActionMessage('Selected Entities section marked as complete.');
      }
      setSaveStatus('saved');
      setSelectedAction('');
      setTimeout(() => {
        setSaveStatus(null);
        setActionMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Choose Action failed:', err);
      setSaveStatus('error');
      if (err.isNetworkError || err.status === 0) {
        setError('Unable to connect to server. Please check if the backend server is running.');
      } else if (err.status === 404) {
        setError('Plan not found. Please refresh the page.');
      } else {
        setError(err.message || 'Action failed. Please try again.');
      }
      setTimeout(() => {
        setSaveStatus(null);
        setError(null);
      }, 5000);
    }
  };

  const planTitle = plan.plan_code
    ? `${plan.plan_code}: ${plan.plan_name || ''}`
    : `Plan ${plan.id}: ${plan.plan_name || ''}`;

  const bannerMessage = error || actionMessage || (saveStatus === 'saved' ? 'Saved.' : saveStatus === 'error' ? 'Failed to save.' : saveStatus === 'saving' ? 'Saving...' : null);
  const bannerType = error ? 'error' : (saveStatus === 'error' ? 'error' : saveStatus === 'saving' ? 'saving' : saveStatus === 'saved' ? 'saved' : null);

  const isActionInProgress = saveStatus === 'saving';

  return (
    <div className={overviewStyles.container} aria-busy={isActionInProgress}>
      {isActionInProgress && (
        <div
          className={styles.loadingOverlay}
          role="status"
          aria-live="polite"
          aria-label="Action in progress"
        >
          <div className={styles.loadingOverlaySpinner} aria-hidden />
          <span className={styles.loadingOverlayText}>Please wait...</span>
        </div>
      )}
      {bannerMessage && (
        <div
          className={`${styles.banner} ${bannerType === 'error' ? styles.bannerError : bannerType === 'saving' ? styles.bannerSaving : styles.bannerSuccess}`}
          role="alert"
        >
          {bannerMessage}
        </div>
      )}
      <h1 className={overviewStyles.mainTitle}>
        <i className="bi bi-list-ul" aria-hidden />
        Site Visit Plan - Selected Entities
      </h1>

      <div className={overviewStyles.collapsible}>
        <button
          type="button"
          className={overviewStyles.collapsibleHeader}
          onClick={() => setDetailsOpen(!detailsOpen)}
          aria-expanded={detailsOpen}
        >
          <span className={overviewStyles.collapsibleHeaderLeft}>
            <i
              className={`bi bi-chevron-down ${overviewStyles.collapsibleChevron} ${detailsOpen ? overviewStyles.open : ''}`}
              aria-hidden
            />
            {planTitle}
          </span>
          <span className={overviewStyles.collapsibleHeaderRight}>
            Status: {plan.status || 'In Progress'}
          </span>
        </button>
        <div
          className={`${overviewStyles.collapsibleBodyWrapper} ${detailsOpen ? overviewStyles.collapsibleBodyOpen : ''}`}
          aria-hidden={!detailsOpen}
        >
          <div className={overviewStyles.collapsibleBody}>
            <div className={overviewStyles.detailRow}>
              <span className={overviewStyles.detailItem}>
                <strong>Plan For:</strong> {plan.plan_for || '—'}
              </span>
              <span className={overviewStyles.detailItem}>
                <strong>Plan Period:</strong> {plan.plan_period || '—'}
              </span>
              <span className={overviewStyles.detailItem}>
                <strong>Number of Site Visits:</strong> {plan.site_visits ?? '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={overviewStyles.collapsible}>
        <button
          type="button"
          className={overviewStyles.collapsibleHeader}
          onClick={() => setResourcesOpen(!resourcesOpen)}
          aria-expanded={resourcesOpen}
        >
          <span className={overviewStyles.collapsibleHeaderLeft}>
            <i className="bi bi-box-arrow-up-right" aria-hidden />
            Resources
            <i
              className={`bi bi-chevron-down ${overviewStyles.collapsibleChevron} ${resourcesOpen ? overviewStyles.open : ''}`}
              aria-hidden
            />
          </span>
        </button>
        <div
          className={`${overviewStyles.collapsibleBodyWrapper} ${resourcesOpen ? overviewStyles.collapsibleBodyOpen : ''}`}
          aria-hidden={!resourcesOpen}
        >
          <div className={overviewStyles.collapsibleBody}>
            <h3 className={overviewStyles.currentDocumentsTitle}>Current Documents</h3>
            <div className={overviewStyles.detailRowSecond}>
              <a href="#view-plan">View Plan</a>
              <span className={overviewStyles.detailRowSeparator} aria-hidden />
              <a href="#program-plan">Program Plan</a>
              <span className={overviewStyles.detailRowSeparator} aria-hidden />
              <a href="#view-contributions">View Contributions</a>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.gridSection}>
        <div className={styles.gridHeader}>
          <button
            type="button"
            className={styles.addGrantsBtn}
            onClick={handleAddGrants}
          >
            <i className="bi bi-plus-circle" aria-hidden />
            Add Grants
          </button>
          <div className={styles.gridHeaderRight}>
            <span className={styles.statusLabel}>Status: {plan.status || 'In Progress'}</span>
            <a href={`/svp/status/${plan.id}`} className={styles.detailedViewLink}>
              <i className="bi bi-list-ul" aria-hidden />
              Detailed View
            </a>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingWrap}>
            <p>Loading entities...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>{error}</p>
            <button type="button" className={styles.retryBtn} onClick={loadEntities}>
              Retry
            </button>
          </div>
        ) : entities.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No entities have been added.</p>
          </div>
        ) : (
          <DataGrid
            columns={ENTITY_COLUMNS}
            data={entities}
            actions={ENTITY_ACTIONS}
            actionButtonLabel="Remove"
            onRowAction={handleRowAction}
            enableSelection={true}
            selectedRows={selectedRows}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
            onViewSelected={handleViewSelected}
            showFilters={true}
          />
        )}
      </div>

      <div className={overviewStyles.footer}>
        <div className={`${overviewStyles.footerLeft} ${styles.footerLeft}`}>
          <Link href={`/svp/status/${plan.id}/coversheet`}>
            Go to Previous Section
          </Link>
          <Link href={`/svp/status/${plan.id}`}>
            Go to Status Overview
          </Link>
        </div>
        <div className={overviewStyles.footerRight}>
          <select
            className={styles.actionSelect}
            aria-label="Choose action"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="">Choose Action</option>
            <optgroup label="- Actions -">
              <option value={ACTION_REMOVE_ENTITIES}>Remove Entities</option>
            </optgroup>
            <optgroup label="- Workflow -">
              <option value={ACTION_CONTINUE}>Continue</option>
              <option value={ACTION_MARK_COMPLETE}>Mark as Complete</option>
            </optgroup>
          </select>
          <button
            type="button"
            className={styles.goBtn}
            onClick={handleGoAction}
            disabled={!selectedAction}
          >
            Go
          </button>
        </div>
      </div>

      {addGrantsModalOpen && (
        <AddGrantsModal
          open={addGrantsModalOpen}
          onClose={handleAddGrantsModalClose}
          onAdd={handleAddGrantsModalAdd}
          planId={plan.id}
        />
      )}
    </div>
  );
}
