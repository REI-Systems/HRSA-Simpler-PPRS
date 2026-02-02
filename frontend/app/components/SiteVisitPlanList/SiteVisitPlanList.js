'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../Layout';
import DataGrid from '../DataGrid';
import SearchModal from '../SearchModal';
import { getMenu, getHeaderNav, getPlans, getConfig } from '../../services';
import styles from './SiteVisitPlanList.module.css';

export default function SiteVisitPlanList() {
  const router = useRouter();
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

  useEffect(() => {
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
        setSearchFilters(defaults);
        setAppliedSearchFilters(defaults);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const defaultSearchValues = gridConfig.default_search_values;
  const isSearchActive = useMemo(() => {
    const sf = appliedSearchFilters;
    return (
      (sf.planNameLike?.trim() ?? '') !== '' ||
      (sf.planPeriod ?? 'All') !== 'All' ||
      (!(sf.statuses ?? []).includes('All') && (sf.statuses ?? []).length > 0) ||
      (!(sf.programs ?? []).includes('All') && (sf.programs ?? []).length > 0) ||
      (!(sf.divisions ?? []).includes('All') && (sf.divisions ?? []).length > 0)
    );
  }, [appliedSearchFilters]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const sf = appliedSearchFilters;
      const planFor = (plan.plan_for || '').toLowerCase();
      const planPeriod = (plan.plan_period || '').toLowerCase();
      const planName = (plan.plan_name || '').toLowerCase();
      const planStatus = plan.status || '';

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
  }, [plans, appliedSearchFilters]);

  const handleSearch = (values) => {
    setSearchFilters(values);
    setAppliedSearchFilters(values);
  };

  const handleResetSearch = () => {
    setSearchFilters(defaultSearchValues);
    setAppliedSearchFilters(defaultSearchValues);
  };

  const handleRowAction = (action, row) => {
    if (action.id === 'view' || action.id === 'edit') {
      router.push('/svp/status/' + encodeURIComponent(row.id));
    } else {
      console.log('Row action:', action.id, 'on row:', row);
    }
  };

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
          <li><a href="#saved" className={styles.savedSearchesIcon}>Saved Searches <i className="bi bi-chevron-down" aria-hidden /></a></li>
        </ul>
      </div>

      <DataGrid
        columns={gridConfig.columns}
        data={filteredPlans}
        actions={gridConfig.row_actions}
        onRowAction={handleRowAction}
        centerAlignColumns={gridConfig.center_align_columns}
        filterBanner={isSearchActive ? 'Search filters applied - showing filtered results' : null}
        onClearFilters={handleResetSearch}
      />

      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSearch={handleSearch}
        onReset={handleResetSearch}
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
