'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DataGrid from '../DataGrid';
import {
  getPlanEntities,
  removeEntityFromPlan,
  startEntityVisit,
  updateEntityStatus,
} from '../../services/svpService';
import overviewStyles from '../SiteVisitPlanStatusOverview/SiteVisitPlanStatusOverview.module.css';
import styles from './IdentifiedSiteVisits.module.css';

const IDENTIFIED_COLUMNS = [
  { key: 'entity_name', label: 'Entity Name', sortable: true, filterable: true, minWidth: 180 },
  { key: 'entity_number', label: 'Entity Number', sortable: true, filterable: true, minWidth: 115 },
  { key: 'state', label: 'State', sortable: true, filterable: true, filterType: 'select', filterOptions: ['All', 'TX', 'IL', 'CA', 'NY', 'FL'], minWidth: 55 },
  { key: 'site_visit_reason_types', label: 'Site Visit Reason Type(s)', sortable: true, filterable: true, minWidth: 180 },
  { key: 'site_visit_dates', label: 'Site Visit Dates', sortable: true, filterable: true, minWidth: 120 },
  { key: 'priority', label: 'Priority', sortable: true, filterable: true, filterType: 'select', filterOptions: ['All', 'High', 'Medium', 'Low'], minWidth: 90 },
  { key: 'travel_cost', label: 'Travel Cost', sortable: true, filterable: true, minWidth: 100 },
  { key: 'travel_flags', label: 'Travel Flag(s)', sortable: true, filterable: true, filterType: 'select', filterOptions: ['All', '0', '1'], minWidth: 100 },
  { key: 'visit_status', label: 'Status', sortable: true, filterable: true, filterType: 'select', filterOptions: ['All', 'Not Started', 'In Progress', 'Complete'], minWidth: 110 },
];

const ROW_ACTIONS = [
  { id: 'start', label: 'Start', iconLeft: 'bi-play-fill', category: 'Action' },
  { id: 'edit_basic_info', label: 'Edit Basic Information', iconLeft: 'bi-pencil', category: 'Action' },
  { id: 'edit_travel_plan', label: 'Edit Travel Plan', iconLeft: 'bi-pencil', category: 'Action' },
  { id: 'mark_complete', label: 'Mark as Complete', iconLeft: 'bi-check-circle', category: 'Action' },
  { id: 'remove', label: 'Remove', iconLeft: 'bi-x-lg', category: 'Action' },
  { id: 'view_basic_info', label: 'View Basic Information', iconLeft: 'bi-eye', category: 'View' },
  { id: 'printable_plan_record', label: 'Printable Plan Record', category: 'View', iconRight: 'bi-box-arrow-up-right' },
  { id: 'grant_site_visits', label: 'Grant Site Visits', category: 'View', iconRight: 'bi-box-arrow-up-right' },
  { id: 'institutional_site_visits', label: 'Institutional Site Visits', category: 'View', iconRight: 'bi-box-arrow-up-right' },
  { id: 'institution_other_grants', label: 'Institution Other Grants', category: 'View', iconRight: 'bi-box-arrow-up-right' },
  { id: 'plan_record_action_history', label: 'Plan Record Action History', category: 'View', iconRight: 'bi-box-arrow-up-right' },
];

function mapEntityToRow(entity) {
  const visitStarted = Boolean(entity.visit_started);
  const status = entity.status || '';
  const visitStatus =
    status === 'Complete' ? 'Complete' : visitStarted ? 'In Progress' : 'Not Started';
  const reasonType = entity.active_new_grant === 'Yes' ? 'New Start/Initial/Newly Funded' : (entity.site_visit_reason_types || '—');
  return {
    id: entity.id,
    plan_id: entity.plan_id,
    entity_name: entity.entity_name || '',
    entity_number: entity.entity_number || '',
    state: entity.state || '',
    site_visit_reason_types: reasonType,
    site_visit_dates: entity.recent_site_visit_dates || 'N/A',
    priority: entity.priority ?? 'Medium',
    travel_cost: entity.travel_cost ?? 'N/A',
    travel_flags: entity.travel_flags ?? '0',
    visit_status: visitStatus,
    visit_started: visitStarted,
  };
}

export default function IdentifiedSiteVisits({ plan, onSaveSuccess, viewMode = false }) {
  const router = useRouter();
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [actionInProgress, setActionInProgress] = useState(false);
  const [chooseActionValue, setChooseActionValue] = useState('');

  const planId = plan?.id;

  const loadEntities = useCallback(() => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    getPlanEntities(planId)
      .then((data) => setEntities(data || []))
      .catch((err) => {
        setEntities([]);
        setError(err.message || 'Failed to load entities.');
      })
      .finally(() => setLoading(false));
  }, [planId]);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const rows = useMemo(() => entities.map(mapEntityToRow), [entities]);

  const planTitle = plan
    ? (plan.plan_code ? `${plan.plan_code}: ${plan.plan_name || ''}` : `Plan ${plan.id}: ${plan.plan_name || ''}`)
    : '';

  const viewQuery = viewMode ? '?view=true' : '';
  const handleRowAction = useCallback(
    async (action, row) => {
      if (!planId || actionInProgress) return;
      if (action.id === 'view_basic_info') {
        router.push(`/svp/status/${encodeURIComponent(planId)}/basic-info/${encodeURIComponent(row.id)}${viewQuery}`);
        return;
      }
      if (viewMode) return;
      if (action.id === 'start') {
        const isNotStarted = row.visit_status === 'Not Started';
        if (isNotStarted) {
          setActionInProgress(true);
          try {
            await startEntityVisit(planId, row.id);
            loadEntities();
            if (onSaveSuccess) onSaveSuccess();
            router.push(`/svp/status/${encodeURIComponent(planId)}/basic-info/${encodeURIComponent(row.id)}`);
          } catch (err) {
            setError(err.message || 'Failed to start site visit.');
          } finally {
            setActionInProgress(false);
          }
        } else {
          router.push(`/svp/status/${encodeURIComponent(planId)}/basic-info/${encodeURIComponent(row.id)}`);
        }
        return;
      }
      if (action.id === 'edit_basic_info') {
        router.push(`/svp/status/${encodeURIComponent(planId)}/basic-info/${encodeURIComponent(row.id)}`);
        return;
      }
      if (action.id === 'mark_complete') {
        setActionInProgress(true);
        try {
          await updateEntityStatus(planId, row.id, 'Complete');
          loadEntities();
          if (onSaveSuccess) onSaveSuccess();
        } catch (err) {
          setError(err.message || 'Failed to mark as complete.');
        } finally {
          setActionInProgress(false);
        }
        return;
      }
      if (action.id === 'remove') {
        if (typeof window !== 'undefined' && !window.confirm(`Remove ${row.entity_name || row.id} from this plan?`)) return;
        setActionInProgress(true);
        try {
          await removeEntityFromPlan(planId, row.id);
          loadEntities();
          if (onSaveSuccess) onSaveSuccess();
        } catch (err) {
          setError(err.message || 'Failed to remove entity.');
        } finally {
          setActionInProgress(false);
        }
        return;
      }
      if (action.id === 'edit_travel_plan') {
        // Placeholder: could open a modal or navigate later
        return;
      }
      // View actions: placeholder
    },
    [planId, actionInProgress, loadEntities, onSaveSuccess, router, viewMode]
  );

  const filterRowAction = useCallback((action, row) => {
    if (viewMode) {
      return action.id === 'view_basic_info';
    }
    if (action.id === 'start') return false; /* primary only, not in dropdown */
    if (action.id === 'edit_basic_info') return Boolean(row.visit_started);
    if (action.id === 'view_basic_info') return false; /* only show in view mode */
    return true;
  }, [viewMode]);

  const handleChooseActionGo = useCallback(async () => {
    if (!planId || actionInProgress || !chooseActionValue) return;
    if (chooseActionValue === 'mark_complete') {
      const ids = Array.from(selectedRows);
      if (ids.length === 0) {
        setError('Select at least one site visit to mark as complete.');
        return;
      }
      setError(null);
      setActionInProgress(true);
      try {
        for (const entityId of ids) {
          await updateEntityStatus(planId, entityId, 'Complete');
        }
        loadEntities();
        if (onSaveSuccess) onSaveSuccess();
        setSelectedRows(new Set());
        setChooseActionValue('');
      } catch (err) {
        setError(err.message || 'Failed to mark as complete.');
      } finally {
        setActionInProgress(false);
      }
    }
  }, [planId, actionInProgress, chooseActionValue, selectedRows, loadEntities, onSaveSuccess]);

  const handleViewSelected = useCallback((selectedIds) => {
    // Placeholder: could open a view of selected rows
  }, []);

  if (loading) {
    return (
      <div className={overviewStyles.container}>
        <p className={overviewStyles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={overviewStyles.container}>
        <p className={overviewStyles.error} role="alert">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={overviewStyles.container}>
      <h1 className={overviewStyles.mainTitle}>
        <i className="bi bi-clipboard-check" aria-hidden />
        Site Visit Plan - Identified Site Visits
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
            Status: {plan?.status || 'In Progress'}
          </span>
        </button>
        <div
          className={`${overviewStyles.collapsibleBodyWrapper} ${detailsOpen ? overviewStyles.collapsibleBodyOpen : ''}`}
          aria-hidden={!detailsOpen}
        >
          <div className={overviewStyles.collapsibleBody}>
            <div className={overviewStyles.detailRow}>
              <span className={overviewStyles.detailItem}>
                <strong>Plan For:</strong> {plan?.plan_for || '—'}
              </span>
              <span className={overviewStyles.detailItem}>
                <strong>Plan Period:</strong> {plan?.plan_period || '—'}
              </span>
              <span className={overviewStyles.detailItem}>
                <strong>Number of Site Visits:</strong> {plan?.site_visits ?? '0'}
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

      <div className={styles.actionBar}>
        <button type="button" className={styles.actionBarBtn}>Collapse Group</button>
        <button type="button" className={styles.actionBarBtn}>Detailed View</button>
        <button type="button" className={styles.actionBarBtn}>Search</button>
      </div>

      <DataGrid
        columns={IDENTIFIED_COLUMNS}
        data={rows}
        actions={viewMode ? ROW_ACTIONS.filter((a) => a.id === 'view_basic_info') : ROW_ACTIONS}
        actionButtonLabel={(row) => (viewMode ? 'View' : (row.visit_status === 'Not Started' ? 'Start' : 'Edit'))}
        primaryActionIcon={(row) => (viewMode ? 'bi-eye' : (row.visit_status === 'Not Started' ? 'bi-play-fill' : 'bi-pencil'))}
        onRowAction={handleRowAction}
        filterRowAction={viewMode ? undefined : filterRowAction}
        enableSelection={!viewMode}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        onViewSelected={handleViewSelected}
        selectionCountLabel="Site Visits"
        showFilters
        defaultPageSize={15}
      />

      <div className={overviewStyles.footer}>
        <div className={overviewStyles.footerLeft}>
          <div className={styles.footerLeftWrap}>
            <Link href={planId ? `/svp/status/${encodeURIComponent(planId)}/selected-entities${viewMode ? '?view=true' : ''}` : '#'}>
              Go to Previous Section
            </Link>
            <Link href={planId ? `/svp/status/${encodeURIComponent(planId)}${viewMode ? '?view=true' : ''}` : '#'}>
              Go to Status Overview
            </Link>
          </div>
        </div>
        {!viewMode && (
          <div className={overviewStyles.footerRight}>
            <select
              value={chooseActionValue}
              onChange={(e) => setChooseActionValue(e.target.value)}
              className={styles.chooseActionSelect}
              aria-label="Choose action"
            >
              <option value="">Choose Action</option>
              <optgroup label="Actions">
                <option value="combine_site_visits">Combine site visits</option>
                <option value="combine_travel_plans">Combine travel plans</option>
                <option value="remove_site_visits">Remove site visit(s)</option>
              </optgroup>
              <optgroup label="Workflow">
                <option value="mark_complete">Mark as Complete</option>
              </optgroup>
            </select>
            <button
              type="button"
              onClick={handleChooseActionGo}
              disabled={actionInProgress || !chooseActionValue}
            >
              Go
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
