---
name: Site Visit Plan List Page
route: /svp
overview: "SVP list page showing a data grid of site visit plans. Loads menu, header nav, plans list, and grid config (columns, row actions, search fields); supports search modal, saved searches, and needs-attention filter. Row actions navigate to status overview or other SVP sub-pages."
todos: []
isProject: false
---

# Site Visit Plan List Page – Prompt for LLM

## Goal

Implement or modify the **Site Visit Plan List** page at route `/svp` so that:
- It displays the app layout (sidebar, header) with "tasks" active and SVP menu expanded.
- It shows a data grid of site visit plans with columns and row actions defined by backend config.
- Users can open a search modal, apply filters, save/load saved searches, and filter by "Needs Attention."
- Row actions (e.g. "View Plan") navigate to `/svp/status/[id]` or other SVP sub-routes.

## Current State

- **Route:** `frontend/app/svp/page.js` — thin wrapper that renders `SiteVisitPlanList` inside `Suspense` with a loading fallback.
- **Main logic:** `frontend/app/components/SiteVisitPlanList/SiteVisitPlanList.js` — fetches `getMenu()`, `getHeaderNav()`, `getPlans()`, `getConfig()`; builds grid config from `config.columns`, `config.center_align_columns`, `config.row_actions`, `config.search_fields`, `config.default_search_values`; manages search modal, saved searches in localStorage, and needs-attention filter.
- **Grid:** `DataGrid` component with plans as rows; row actions derived from config (e.g. "View Plan" → navigate to status overview).

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/svp/page.js` |
| List component | `frontend/app/components/SiteVisitPlanList/SiteVisitPlanList.js`, `SiteVisitPlanList.module.css` |
| DataGrid | `frontend/app/components/DataGrid/DataGrid.js` |
| Search modal | `frontend/app/components/SearchModal/SearchModal.js` |
| Services | `getMenu`, `getHeaderNav`, `getPlans`, `getConfig` from `frontend/app/services` |
| Backend | `backend/routes/svp_list_routes.py`, `backend/routes/layout_routes.py` |

## Prompt-Style Instructions for Another LLM

1. **Data loading:** On mount (and when refreshing), call `getMenu()`, `getHeaderNav()`, `getPlans()`, `getConfig()`. Use `getConfig()` to set grid columns, center-aligned columns, row actions, search fields, and default search values. Merge default search values into initial filter state.
2. **Grid:** Render `DataGrid` with `data={plans}`, column config from backend, and row actions. When a row action is "View Plan" (or equivalent), use `router.push('/svp/status/' + plan.id)` or the action’s configured route.
3. **Search:** Implement a search modal that shows fields from `search_fields` and applies filters to the list (client-side or request new list from backend if API supports it). Persist "saved searches" in localStorage under a stable key (e.g. `svp_saved_searches`) as JSON array.
4. **Needs Attention:** If the backend or config exposes a "needs attention" flag per plan, add a filter toggle and filter the displayed plans accordingly.
5. **Layout:** Use `AppLayout` with `menuItems`, `navItems`, `activeNavItem="tasks"`, `defaultExpandedMenuIds={['svp']}`. Show loading state until data is ready; show error state if any fetch fails.
6. **Create plan:** Ensure there is a way to navigate to `/svp/initiate` (e.g. button or menu item).

## Data / API

- **getPlans():** Returns list of plans (array of objects with id, plan_name, status, etc.).
- **getConfig():** Returns `{ columns, center_align_columns, row_actions, search_fields, default_search_values }` for the grid and search form.
- **Plans shape:** Typically `{ id, plan_code?, plan_name, plan_for, plan_period, status, site_visits, team_name, needs_attention?, ... }`.
