'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import AppLayout from '../../../core/Layout';
import DataGrid from '../../../core/DataGrid';
import SearchModal from '../../../core/SearchModal';
import ConfirmModal from '../../../core/ConfirmModal';
import { getMenu, getHeaderNav, getPlans, getConfig, cancelPlan } from '../../../../services';
import styles from './SiteVisitPlanList.module.css';

const SAVED_SEARCHES_STORAGE_KEY = 'svp_saved_searches';

/** Default columns when backend config is empty (e.g. svp_column not seeded). */
const DEFAULT_LIST_COLUMNS = [
  { key: 'plan_code', label: 'Plan Code', filterable: true },
  { key: 'plan_for', label: 'Plan For', filterable: true },
  { key: 'plan_period', label: 'Plan Period', filterable: true },
  { key: 'plan_name', label: 'Plan Name', filterable: true },
  { key: 'site_visits', label: 'Number of Site Visits', filterable: true },
  { key: 'status', label: 'Status', filterable: true, filterType: 'select', filterOptions: ['All', 'Not Started', 'In Progress', 'Complete', 'Not Complete', 'Canceled'] },
  { key: 'team_name', label: 'Team Name', filterable: true },
  { key: 'needs_attention', label: 'Needs Attention', filterable: true },
];

/** Default row actions when backend config is empty. */
const DEFAULT_ROW_ACTIONS = [
  { id: 'edit', label: 'Edit Plan', iconLeft: 'bi-pencil-square', category: 'Action' },
  { id: 'cancel', label: 'Cancel Plan', iconLeft: 'bi-x-lg', category: 'Action', separator: true },
  { id: 'view', label: 'View Plan', iconRight: 'bi-box-arrow-up-right', category: 'View' },
];

function loadSavedSearches() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_SEARCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSavedSearches(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_SEARCHES_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

export default function SiteVisitPlanList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [navItems, setNavItems] = useState([]);
  const [plans, setPlans] = useState([]);
  const [gridConfig, setGridConfig] = useState({
    columns: [],
    center_align_columns: [],
    row_actions: [],
    search_fields: [],
    default_search_values: {},
  });

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState({});
  const [appliedSearchFilters, setAppliedSearchFilters] = useState({});
  const [filterByNeedsAttention, setFilterByNeedsAttention] = useState(false);

  const [savedSearches, setSavedSearches] = useState([]);
  const [activeSavedSearchId, setActiveSavedSearchId] = useState('default');
  const [savedSearchDropdownOpen, setSavedSearchDropdownOpen] = useState(false);
  const savedSearchDropdownRef = useRef(null);
  const [cancelPlanId, setCancelPlanId] = useState(null);

  const fetchListData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getMenu(), getHeaderNav(), getPlans(), getConfig()])
      .then(([menu, nav, plansData, config]) => {
        setMenuItems(menu);
        setNavItems(nav);
        setPlans(plansData);
        setGridConfig({
          columns: config.columns ?? [],
          center_align_columns: config.center_align_columns ?? [],
          row_actions: config.row_actions ?? [],
          search_fields: config.search_fields ?? [],
          default_search_values: config.default_search_values ?? {},
        });
        const defaults = config.default_search_values ?? {};
        setSearchFilters((prev) => (Object.keys(prev).length === 0 ? defaults : prev));
        setAppliedSearchFilters((prev) => (Object.keys(prev).length === 0 ? defaults : prev));
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Refetch when user lands on list (pathname) so Coversheet/Status changes are reflected
  useEffect(() => {
    fetchListData();
  }, [fetchListData, pathname]);

  // Refetch when user returns to this tab so list stays in sync after editing elsewhere
  useEffect(() => {
    const onFocus = () => fetchListData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchListData]);

  // Load saved searches from localStorage on mount
  useEffect(() => {
    setSavedSearches(loadSavedSearches());
  }, []);

  // Close Saved Search dropdown when clicking outside
  useEffect(() => {
    if (!savedSearchDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (savedSearchDropdownRef.current && !savedSearchDropdownRef.current.contains(e.target)) {
        setSavedSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [savedSearchDropdownOpen]);

  // Apply filters from URL when navigating from Welcome page status cards (?status=... or ?needsAttention=true)
  const defaultSearchValues = gridConfig.default_search_values;
  useEffect(() => {
    const defaults = defaultSearchValues ?? {};
    if (Object.keys(defaults).length === 0) return;
    const status = searchParams.get('status');
    const needsAttention = searchParams.get('needsAttention');
    const nextFilters = status != null && status !== ''
      ? { ...defaults, statuses: [status] }
      : { ...defaults };
    setSearchFilters(nextFilters);
    setAppliedSearchFilters(nextFilters);
    setFilterByNeedsAttention(needsAttention === 'true');
  }, [searchParams, defaultSearchValues]);

  const isSearchActive = useMemo(() => {
    const sf = appliedSearchFilters;
    return (
      (sf.planNameLike?.trim() ?? '') !== '' ||
      (sf.planPeriod ?? 'All') !== 'All' ||
      (!(sf.statuses ?? []).includes('All') && (sf.statuses ?? []).length > 0) ||
      (!(sf.programs ?? []).includes('All') && (sf.programs ?? []).length > 0) ||
      (!(sf.divisions ?? []).includes('All') && (sf.divisions ?? []).length > 0) ||
      filterByNeedsAttention
    );
  }, [appliedSearchFilters, filterByNeedsAttention]);

  // Use default columns/actions when config is empty (e.g. svp_column not seeded). Ensure Plan Code is first.
  const gridColumns = useMemo(() => {
    const cols = gridConfig.columns ?? [];
    const useCols = cols.length > 0 ? cols : DEFAULT_LIST_COLUMNS;
    if (useCols[0]?.key === 'plan_code') return useCols;
    const planCodeCol = { key: 'plan_code', label: 'Plan Code', filterable: true };
    return [planCodeCol, ...useCols];
  }, [gridConfig.columns]);

  const gridCenterAlignColumns = useMemo(() => {
    const cols = gridConfig.columns ?? [];
    const center = gridConfig.center_align_columns ?? [];
    const useCols = cols.length > 0 ? cols : DEFAULT_LIST_COLUMNS;
    if (useCols[0]?.key === 'plan_code') return center;
    return center.map((i) => i + 1);
  }, [gridConfig.columns, gridConfig.center_align_columns]);

  const gridRowActions = useMemo(() => {
    const actions = gridConfig.row_actions ?? [];
    return actions.length > 0 ? actions : DEFAULT_ROW_ACTIONS;
  }, [gridConfig.row_actions]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const sf = appliedSearchFilters;
      const planFor = (plan.plan_for || '').toLowerCase();
      const planPeriod = (plan.plan_period || '').toLowerCase();
      const planName = (plan.plan_name || '').toLowerCase();
      const planStatus = plan.status || '';

      if (filterByNeedsAttention) {
        const needsAtt = (plan.needs_attention || '').toString().trim().toLowerCase();
        if (needsAtt !== 'yes') return false;
      }

      if ((sf.planNameLike?.trim() ?? '') && !planName.includes((sf.planNameLike ?? '').trim().toLowerCase())) return false;
      if ((sf.planPeriod ?? 'All') !== 'All' && !planPeriod.includes((sf.planPeriod ?? '').toLowerCase())) return false;

      const statuses = sf.statuses ?? [];
      if (!statuses.includes('All') && statuses.length > 0 && !statuses.includes(planStatus)) return false;

      const programs = sf.programs ?? [];
      if (!programs.includes('All') && programs.length > 0) {
        const matchesProgram = programs.some((prog) => planFor.includes((prog ?? '').toLowerCase()));
        if (!matchesProgram) return false;
      }

      const divisions = sf.divisions ?? [];
      if (!divisions.includes('All') && divisions.length > 0) {
        const matchesDivision = divisions.some((div) => planFor.includes((div ?? '').toLowerCase()));
        if (!matchesDivision) return false;
      }

      return true;
    });
  }, [plans, appliedSearchFilters, filterByNeedsAttention]);

  const handleSearch = (values) => {
    setSearchFilters(values);
    setAppliedSearchFilters(values);
    setActiveSavedSearchId(null);
  };

  const handleResetSearch = () => {
    setSearchFilters(defaultSearchValues);
    setAppliedSearchFilters(defaultSearchValues);
    setFilterByNeedsAttention(false);
    setActiveSavedSearchId('default');
  };

  const applySavedSearch = useCallback(
    (saveId) => {
      const defaults = defaultSearchValues ?? {};
      if (saveId === 'default') {
        setSearchFilters(defaults);
        setAppliedSearchFilters(defaults);
        setFilterByNeedsAttention(false);
        setActiveSavedSearchId('default');
        setSavedSearchDropdownOpen(false);
        return;
      }
      const saved = savedSearches.find((s) => s.id === saveId);
      if (!saved?.params) return;
      const { needsAttention, ...rest } = saved.params;
      const params = { ...defaults, ...rest };
      setSearchFilters(params);
      setAppliedSearchFilters(params);
      setFilterByNeedsAttention(Boolean(needsAttention));
      setActiveSavedSearchId(saveId);
      setSavedSearchDropdownOpen(false);
    },
    [defaultSearchValues, savedSearches]
  );

  const removeSavedSearch = useCallback(
    (id, e) => {
      e.stopPropagation();
      const next = savedSearches.filter((s) => s.id !== id);
      setSavedSearches(next);
      saveSavedSearches(next);
      if (activeSavedSearchId === id) {
        const defaults = defaultSearchValues ?? {};
        setSearchFilters(defaults);
        setAppliedSearchFilters(defaults);
        setFilterByNeedsAttention(false);
        setActiveSavedSearchId('default');
      }
    },
    [savedSearches, activeSavedSearchId, defaultSearchValues]
  );

  const handleSaveParameters = useCallback(
    (modalValues) => {
      const name = (modalValues.searchName || '').trim() || 'Unnamed';
      const params = { ...modalValues };
      delete params.searchName;
      params.needsAttention = filterByNeedsAttention;
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `saved-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const next = [...savedSearches, { id, name, params }];
      setSavedSearches(next);
      saveSavedSearches(next);
      const { needsAttention: needsAtt, ...filterParams } = params;
      setAppliedSearchFilters((prev) => ({ ...prev, ...filterParams }));
      setSearchFilters((prev) => ({ ...prev, ...filterParams }));
      setFilterByNeedsAttention(Boolean(needsAtt));
      setActiveSavedSearchId(id);
      setSearchModalOpen(false);
    },
    [filterByNeedsAttention, savedSearches]
  );

  const getActionDisabled = useCallback((action, row) => {
    if ((row?.status || '').toString().trim() !== 'Complete') return false;
    return action.id === 'edit' || action.id === 'cancel';
  }, []);

  const handleRowAction = (action, row) => {
    if (action.id === 'view') {
      router.push('/svp/status/' + encodeURIComponent(row.id) + '?view=true');
    } else if (action.id === 'edit') {
      router.push('/svp/status/' + encodeURIComponent(row.id));
    } else if (action.id === 'cancel') {
      setCancelPlanId(row.id);
    } else {
      console.log('Row action:', action.id, 'on row:', row);
    }
  };

  const handleCancelPlanConfirm = useCallback(() => {
    if (!cancelPlanId) return;
    const planId = cancelPlanId;
    setCancelPlanId(null);
    cancelPlan(planId)
      .then(() => {
        fetchListData();
      })
      .catch((err) => {
        setError(err.message || 'Failed to cancel plan.');
      });
  }, [cancelPlanId, fetchListData]);

  const handleCancelPlanClose = useCallback(() => {
    setCancelPlanId(null);
  }, []);

  const content = loading ? (
    <div className={styles.loadingWrap}>
      <p>Loading...</p>
    </div>
  ) : error ? (
    <div className={styles.errorWrap}>
      <p className={styles.error}>Error: {error}. Make sure the backend is running.</p>
    </div>
  ) : (
    <>
      <h2 className={styles.mainTitle}>
        <i className="bi bi-card-checklist" aria-hidden />
        Site Visit Plan - List
      </h2>

      <div className={styles.actionBar}>
        <a href="/svp/initiate" className={styles.initiateBtn}>+ Initiate Plan</a>
        <ul className={styles.viewDetails}>
          <li className={styles.searchLi}>
            {isSearchActive && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={handleResetSearch}
                aria-label="Clear search filters"
                title="Clear search filters"
              >
                <i className="bi bi-x-circle-fill" aria-hidden />
              </button>
            )}
            <button
              type="button"
              className={`${styles.searchIcon} ${isSearchActive ? styles.searchActive : ''}`}
              onClick={() => setSearchModalOpen(true)}
              aria-expanded={searchModalOpen}
              aria-haspopup="dialog"
            >
              Search {isSearchActive && <span className={styles.searchActiveBadge}>●</span>}
              <i className="bi bi-chevron-down" aria-hidden />
            </button>
          </li>
          <li className={styles.savedSearchLi} ref={savedSearchDropdownRef}>
            <button
              type="button"
              className={styles.savedSearchesIcon}
              onClick={() => setSavedSearchDropdownOpen((o) => !o)}
              aria-expanded={savedSearchDropdownOpen}
              aria-haspopup="listbox"
            >
              Saved Search <i className="bi bi-chevron-down" aria-hidden />
            </button>
            {savedSearchDropdownOpen && (
              <ul className={styles.savedSearchDropdown} role="listbox">
                <li
                  role="option"
                  aria-selected={activeSavedSearchId === 'default'}
                  className={styles.savedSearchItem}
                  onClick={() => applySavedSearch('default')}
                >
                  {activeSavedSearchId === 'default' && (
                    <i className={`bi bi-check2 ${styles.savedSearchTick}`} aria-hidden />
                  )}
                  <span className={activeSavedSearchId === 'default' ? styles.savedSearchItemLabel : ''}>
                    Default Parameter
                  </span>
                </li>
                {savedSearches.map((s) => (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={activeSavedSearchId === s.id}
                    className={styles.savedSearchItem}
                    onClick={() => applySavedSearch(s.id)}
                  >
                    {activeSavedSearchId === s.id && (
                      <i className={`bi bi-check2 ${styles.savedSearchTick}`} aria-hidden />
                    )}
                    <span className={activeSavedSearchId === s.id ? styles.savedSearchItemLabel : ''}>
                      {s.name}
                    </span>
                    <button
                      type="button"
                      className={styles.savedSearchRemoveBtn}
                      onClick={(e) => removeSavedSearch(s.id, e)}
                      aria-label={`Remove saved search "${s.name}"`}
                      title={`Remove "${s.name}"`}
                    >
                      <i className="bi bi-x" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </div>

      <DataGrid
        columns={gridColumns}
        data={filteredPlans}
        actions={gridRowActions}
        onRowAction={handleRowAction}
        getActionDisabled={getActionDisabled}
        centerAlignColumns={gridCenterAlignColumns}
        filterBanner={isSearchActive ? 'Search filters applied - showing filtered results' : null}
        onClearFilters={handleResetSearch}
      />

      <ConfirmModal
        open={Boolean(cancelPlanId)}
        title="Cancel Plan"
        message="Are you sure you want to cancel this plan? This will permanently remove the plan and all its data."
        confirmLabel="Cancel Plan"
        cancelLabel="Keep Plan"
        confirmVariant="danger"
        onConfirm={handleCancelPlanConfirm}
        onCancel={handleCancelPlanClose}
      />
      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSearch={handleSearch}
        onReset={handleResetSearch}
        onSaveParameters={handleSaveParameters}
        fields={gridConfig.search_fields}
        initialValues={searchFilters}
      />
    </>
  );

  return (
    <AppLayout
      menuItems={menuItems}
      navItems={navItems.length > 0 ? navItems : undefined}
      activeNavItem="tasks"
      defaultExpandedMenuIds={[]}
    >
      {content}
    </AppLayout>
  );
}
