---
name: Site Visit Plan Identified Site Visits Page
route: /svp/status/[id]/identified-site-visits
overview: "Identified site visits for a plan: data grid of entities (from plan) with entity name, number, state, reason types, dates, priority, travel cost, visit status. Row actions: Start, Edit Basic Information, Edit Travel Plan, Remove, and view links (Printable Plan Record, Grant Site Visits, etc.). Uses AppLayout and IdentifiedSiteVisits component."
todos: []
isProject: false
---

# Site Visit Plan Identified Site Visits Page – Prompt for LLM

## Goal

Implement or modify the **Site Visit Plan Identified Site Visits** page at route `/svp/status/[id]/identified-site-visits` so that:
- It loads the plan by id and displays a grid of entities that are "identified" for site visits (same or similar data source as selected entities but in "identified" workflow state).
- Each row shows entity name, entity number, state, site visit reason type(s), site visit dates, priority, travel cost, travel flags, visit status. Row actions: Start (start visit), Edit Basic Information (navigate to basic-info/[entityId]), Edit Travel Plan, Remove, and view-only links (Printable Plan Record, Grant Site Visits, Institutional Site Visits, etc.).
- Layout uses AppLayout; active nav "tasks," SVP menu expanded. On save/update success, refetch plan so section status stays in sync.

## Current State

- **Route:** `frontend/app/svp/status/[id]/identified-site-visits/page.js`.
- **Component:** `IdentifiedSiteVisits` receives `plan`, `onSaveSuccess` (e.g. `loadPlan`).
- **Data:** Page fetches `getMenu()`, `getHeaderNav()`, `getPlanById(id)`; component may fetch entities via `getPlanEntities(plan.id)` or equivalent (check component for exact API). Entities are mapped to grid rows with `visit_status` derived from `visit_started` (In Progress vs Not Started).
- **Row actions:** Start → `startEntityVisit(planId, entityId)` or similar; Edit Basic Information → `router.push('/svp/status/[id]/basic-info/' + entityId)`; Remove → remove entity; view actions may open new tab or modal.
- **Component:** Uses DataGrid with IDENTIFIED_COLUMNS and ROW_ACTIONS; handles loading, error, and save status.

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/svp/status/[id]/identified-site-visits/page.js` |
| Component | `frontend/app/components/IdentifiedSiteVisits/IdentifiedSiteVisits.js`, module CSS |
| Services | `getMenu`, `getHeaderNav`, `getPlanById`, `getPlanEntities`, `removeEntityFromPlan`, `startEntityVisit` from `svpService` |
| Backend | SVP list/plan and entity endpoints (e.g. plan entities, start visit, remove entity) |

## Prompt-Style Instructions for Another LLM

1. **Route params:** Read `params.id` from `useParams()`. If missing, show error. Fetch plan with `getPlanById(id)`; pass `plan` to component. Component may fetch entity list internally via `getPlanEntities(plan.id)`.
2. **Layout:** Use `AppLayout` with `menuItems`, `navItems`, `activeNavItem="tasks"`, `defaultExpandedMenuIds={['svp']}`.
3. **Refetch on success:** Pass `onSaveSuccess={loadPlan}` so that after removing an entity or starting a visit the plan is refetched (and component can refetch entities if needed).
4. **Row action navigation:** "Edit Basic Information" must navigate to `/svp/status/[id]/basic-info/[entityId]` using the row’s entity id. "Start" should call the backend to mark visit as started and then refresh data.
5. **Grid columns:** Match the component’s column definitions (entity_name, entity_number, state, site_visit_reason_types, site_visit_dates, priority, travel_cost, travel_flags, visit_status). Support filtering where defined (e.g. state, priority, visit_status).
6. **Backend:** Use snake_case for entity and plan fields. Endpoints: get plan entities for identified list, start entity visit, remove entity from plan. Optional: update section status when user marks this section complete.

## Data / API

- **getPlanById(id):** Returns plan.
- **getPlanEntities(planId):** Returns list of entities for this plan (identified site visits). Entity shape: id, entity_name, entity_number, state, site_visit_reason_types, recent_site_visit_dates, priority, travel_cost, travel_flags, visit_started, etc.
- **startEntityVisit(planId, entityId):** Marks the entity’s visit as started.
- **removeEntityFromPlan(planId, entityId):** Removes entity from plan (or from identified list).
