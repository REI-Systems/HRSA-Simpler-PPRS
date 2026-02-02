# Prompt: Site Visit Plan List Page & Shared UI Architecture

Use this prompt with any LLM to reproduce the Site Visit Plan List page, reusable layout components, DataGrid (with multi-column sort and search), and consistent blank/empty sorting behavior.

---

## Context

You are working on a community-driven platform with:

- **Frontend**: Next.js 14 (App Router), React, CSS Modules
- **Backend**: Flask, Python
- **Data**: Central `backend/data/static_data.json` loaded via `backend/data_repository.py` (repository pattern; optionally reload when file changes)
- **API**: Frontend calls backend via `apiGet` (see `frontend/app/services/api.js`); config from `getConfig()` → `GET /api/svp/config`; plans from `getPlans()` → `GET /api/svp/plans`; menu from `getMenu()`, header nav from `getHeaderNav()`

## Task

1. Refactor the Site Visit Plan List page into **reusable layout and grid components**.
2. Implement a **DataGrid** with inline column filters, **multi-column sorting** (order of selection), a **sort-order banner** above the grid, and correct handling of **blank/empty values** in all columns.
3. Wire **SearchModal** to the grid (applied filters, filter banner, clear filters).
4. Add a short **animation** when filter or sort results change.

Assume the SVP list page initially has a single large component; split it into Layout, Header, Sidebar, Footer, DataGrid, and SearchModal as described below.

---

## Architecture Overview

- **LayoutContext** (React Context): Holds shared state for sidebar (open/pinned), user, display date/time, last login; provides toggle functions.
- **AppLayout**: Wraps `children` with Header, Sidebar, and Footer; provides `LayoutContext.Provider`.
- **Header**: Two rows—Row 1: logo (left), user links + username dropdown (right); Row 2: main nav (left), timestamp (right). Blue gradient background; button-like main nav with hover/active styles.
- **Sidebar**: Left menu with one orange hamburger toggle, pin icon (pinned: `bi-pin-fill` rotated; unpinned: `bi-pin-angle`), search, collapsible items. Path-based active state; PAO collapsed by default.
- **Footer**: Links, version, last login.
- **DataGrid**: Generic table with props: `columns`, `data`, `actions`, `onRowAction`, `filterBanner`, `onClearFilters`, `centerAlignColumns`, `showFilters`, `pageSizes`, `defaultPageSize`, `actionButtonLabel`. Supports inline column filters, pagination (first/prev/numbers/next/last with « »), row action dropdown, and **multi-column sort**.
- **SearchModal**: Configurable advanced search (props: `open`, `onClose`, `onSearch`, `onReset`, `fields`, `initialValues`). Used by the list page for Plan Name, Plan Period, Program, Status, Division filters.

---

## Requirements

### 1. Layout & Shared State

- **LayoutContext.js**: State: `sidebarOpen`, `sidebarPinned`, `user`, `displayDateTime`, `lastLogin`. Provide setters/toggles for sidebar and any needed for header/footer.
- **AppLayout.js**: Composes Header, Sidebar, Footer; renders `children` in main content area; uses `LayoutContext.Provider`. Props: `menuItems`, `navItems`, `activeNavItem`, `defaultExpandedMenuIds`.
- **Header**: Logo, user dropdown (e.g. "View/Update Profile", "Manage Favorites", "Recently Accessed", "Set Backup"), Request Access, Support, Logout; main nav items; current timestamp. Style: blue gradient; nav items as buttons with hover/active.
- **Sidebar**: Single orange hamburger toggles sidebar; pin icon differentiates pinned vs unpinned; menu items from props; expand/collapse; path-based active highlight; search expands matching parents; reduced padding between sidebar and main content (e.g. 12px).
- **Footer**: Static links and version/last login from context.

### 2. DataGrid

- **Columns**: Driven by config (`columns` from API). Each column: `key`, `label`, `filterable`, optional `filterType: 'select'`, `filterOptions`.
- **Inline filters**: Row below headers—text inputs or select (when `filterType === 'select'`) per column. Filter state is internal; filtered data is computed before sort.
- **Sorting**:
  - **Multi-column sort**: State is an array of `{ key, direction }` in **order of selection**. Clicking a column: if not in list, append `{ key, direction: 'asc' }`; if already in list, toggle `asc` → `desc`; one more click removes that column from sort.
  - Apply sort by iterating the sort-order array: compare rows by first key; if equal, by second key; etc. Use a single `compareCells(key, direction, a, b)` helper.
  - **Blank/empty handling**: Treat `null`, `undefined`, empty string, or whitespace-only as "empty". Empty always sorts **first in ascending**, **last in descending**. Use a helper e.g. `isEmptySortValue(val)` so all columns behave consistently.
  - Numeric: when both values are numeric, compare by number; otherwise compare by string (e.g. `localeCompare` with `numeric: true`).
- **Sort UI**:
  - Column headers: sortable columns are buttons. Show **priority number** (1, 2, 3…) and **arrow** (↑ asc, ↓ desc) for columns in the sort order; show neutral sort icon for unsorted sortable columns.
  - **Sort banner** above the grid when `sortOrder.length > 0`: e.g. "Sort by: 1. Plan For ↑, 2. Status ↓" and a "Clear sort" button that sets sort order to `[]`.
- **Pagination**: Page size selector, first («), previous (◄), page numbers, next (►), last (»). Base pagination on **sorted** (and filtered) data; reset to page 1 when filters or sort order change.
- **Animation**: When `filteredData` or `sortOrder` changes, trigger a short (e.g. 320ms) fade or similar animation on the table body so users see that the list updated.
- **Row actions**: Optional "Options" column with a dropdown (e.g. "Edit Plan", "Cancel Plan", "View Plan") driven by `actions` and `onRowAction`.

### 3. SearchModal & List Page Integration

- **SiteVisitPlanList**: Fetches menu, header nav, plans, and **config** (columns, row_actions, search_fields, default_search_values). Keeps state: `appliedSearchFilters` (used for grid filtering), `searchModalOpen`, `searchFilters` (current form values).
- **Filtering**: Compute `filteredPlans` from `plans` using `appliedSearchFilters` (plan name like, plan period, statuses, programs, divisions). Pass `filteredPlans` to DataGrid as `data`.
- **SearchModal**: Opens from a "Search" button; fields come from config `search_fields`. On "Search", set `appliedSearchFilters` and close modal. On "Reset", set filters to defaults. When any search filter is active, show an indicator (e.g. dot or bold "Search") and a **filter banner** above the grid: "Search filters applied - showing filtered results" with "Clear Filters" that resets applied filters.
- **DataGrid**: Receive `filterBanner` and `onClearFilters` from list page when search filters are active.

### 4. Backend / Data

- **static_data.json**: Under `svp`, provide `columns` (with `key`, `label`, `filterable`, and for Status e.g. `filterType: "select"`, `filterOptions`), `center_align_columns` (column indices), `row_actions`, `search_fields`, `default_search_values`, and `plans` array. Column "Number of Site Visits" (key `site_visits`); "Needs Attention" (key `needs_attention`).
- **data_repository.py**: Expose `get_svp_config()` and `get_svp_plans()` from `svp`; optionally invalidate cache when `static_data.json` mtime changes so edits are picked up without restart.
- **app.py**: `GET /api/svp/config`, `GET /api/svp/plans` (and existing menu/header-nav endpoints).

### 5. File Summary

| Action | Path |
|--------|------|
| Create | `frontend/app/contexts/LayoutContext.js` |
| Create | `frontend/app/components/Layout/AppLayout.js`, `AppLayout.module.css`, `index.js` |
| Create | `frontend/app/components/Header/Header.js`, `Header.module.css`, `index.js` |
| Create | `frontend/app/components/Sidebar/Sidebar.js`, `Sidebar.module.css`, `index.js` |
| Create | `frontend/app/components/Footer/Footer.js`, `Footer.module.css`, `index.js` |
| Create | `frontend/app/components/DataGrid/DataGrid.js`, `DataGrid.module.css`, `index.js` |
| Create | `frontend/app/components/SearchModal/SearchModal.js`, `SearchModal.module.css`, `index.js` |
| Modify | `frontend/app/components/SiteVisitPlanList/SiteVisitPlanList.js`, `SiteVisitPlanList.module.css` |
| Modify | `backend/data/static_data.json` (svp columns/plans/config as needed) |
| Modify | `backend/data_repository.py` (get_svp_config, get_svp_plans; optional cache invalidation) |
| Modify | `backend/app.py` (routes for svp config and plans) |

### 6. Implementation Notes for Any LLM

- **Sort comparison**: Implement `compareCells(key, direction, a, b)` to return -1, 0, or 1. Check empty first (both empty → 0; only a empty → -1*mult; only b empty → 1*mult); then numeric if both values are numbers; else string compare. `mult = direction === 'asc' ? 1 : -1`.
- **Multi-sort**: `sortedData = [...filteredData].sort((a,b) => { for (const { key, direction } of sortOrder) { const c = compareCells(key, direction, a, b); if (c !== 0) return c; } return 0; })`.
- **Animation**: Set a `gridAnimating` flag to true when `filteredData` or `sortOrder` changes; clear it after a timeout (e.g. 320ms). Apply a CSS class to the table body (e.g. fade) when `gridAnimating` is true.
- Use **CSS Modules** for all new components. Use **Bootstrap Icons** (bi-*) where the existing app does. Keep **snake_case** for API/backend fields; **camelCase** in React where appropriate.
- **SiteVisitPlanList** should remain the owner of SVP-specific state (plans, search filters, applied filters) and pass only props into AppLayout, DataGrid, and SearchModal.

---

## Success Criteria

- List page at `/svp` uses AppLayout (Header, Sidebar, Footer) and shows DataGrid with plans from API.
- Column headers are clickable; multiple columns can be selected for sort in order; sort order is visible in a banner above the grid with "Clear sort"; priority numbers and arrows appear in headers.
- Blank/empty cells sort first in ascending and last in descending for every column.
- Inline column filters and SearchModal filters both affect the grid; filter banner and "Clear Filters" appear when search filters are applied.
- Grid body animates (e.g. brief fade) when filter or sort changes.
- Pagination uses « » for first/last and resets to page 1 when filters or sort change.
