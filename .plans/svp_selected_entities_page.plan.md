---
name: Site Visit Plan Selected Entities Page
route: /svp/status/[id]/selected-entities
overview: "Selected entities for a plan: data grid of entities with add/remove and action buttons (Remove, Continue, Mark Complete). Add Grants modal to search and add entities; row action Remove; footer actions call backend and optionally update section status. Uses AppLayout and SelectedEntities component."
todos: []
isProject: false
---

# Site Visit Plan Selected Entities Page – Prompt for LLM

## Goal

Implement or modify the **Site Visit Plan Selected Entities** page at route `/svp/status/[id]/selected-entities` so that:
- It loads the plan by id and displays a grid of entities currently selected for the plan (entity number, name, city, state, midpoint/PP fields, status, recent site visit dates, etc.).
- User can open an "Add Grants" (or "Add Entities") modal to search available entities and add them to the plan. Row action "Remove" removes an entity from the plan. Footer actions (e.g. Remove Selected, Continue, Mark Complete) call the backend and may update section status; on success refetch plan and entity list.
- Layout uses AppLayout; active nav "tasks," SVP menu expanded.

## Current State

- **Route:** `frontend/app/svp/status/[id]/selected-entities/page.js`.
- **Component:** `SelectedEntities` receives `plan`, `onSaveSuccess` (e.g. `loadPlan`).
- **Data:** Component fetches entities via `getPlanEntities(plan.id)` and available entities via `getAvailableEntities(planId)` for the Add modal. Uses `addEntityToPlan`, `removeEntityFromPlan`, `updatePlanSectionStatus` from `svpService`.
- **Grid:** ENTITY_COLUMNS (entity_number, entity_name, city, state, midpoint_current_pp, active_grant_*, status, recent_site_visit_dates); row action Remove. Multi-select for "Remove Selected" in footer.
- **Modal:** AddGrantsModal for searching and adding entities. Footer: Remove Selected, Continue, Mark Complete; each may call backend and then `onSaveSuccess()`.

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/svp/status/[id]/selected-entities/page.js` |
| Component | `frontend/app/components/SelectedEntities/SelectedEntities.js`, module CSS |
| Add modal | `frontend/app/components/AddGrantsModal/AddGrantsModal.js` |
| Services | `getMenu`, `getHeaderNav`, `getPlanById`, `getPlanEntities`, `getAvailableEntities`, `addEntityToPlan`, `removeEntityFromPlan`, `updatePlanSectionStatus` from `svpService` |
| Backend | `backend/routes/selected_entities_routes.py`, `backend/services/selected_entities_service.py`, `backend/repositories/selected_entities_repository.py` |

## Prompt-Style Instructions for Another LLM

1. **Route params:** Read `params.id` from `useParams()`. If missing, show error. Fetch plan with `getPlanById(id)`; pass `plan` and `onSaveSuccess={loadPlan}` to component. Component loads its own entity list and available-entities for the modal.
2. **Layout:** Use `AppLayout` with `menuItems`, `navItems`, `activeNavItem="tasks"`, `defaultExpandedMenuIds={['svp']}`.
3. **Refetch on success:** After add entity, remove entity, remove selected, continue, or mark complete, the component or page should refetch the plan (and component refetches entities) so the grid and section status stay in sync.
4. **Add modal:** Implement or reuse AddGrantsModal that calls `getAvailableEntities(planId)` (or search API) and `addEntityToPlan(planId, entityId)` to add. Close modal and refresh entity list on success.
5. **Remove:** Single row "Remove" and bulk "Remove Selected" should call `removeEntityFromPlan(planId, entityId)` for each. Then call `onSaveSuccess()`.
6. **Section status:** "Continue" or "Mark Complete" may call `updatePlanSectionStatus(planId, sectionId, status)` so the status overview page shows the correct section status. Use section id consistent with backend (e.g. `selected_entities`).
7. **Backend:** Use snake_case for columns and API fields. Endpoints: list plan entities, list available entities (or search), add entity to plan, remove entity from plan, update plan section status.

## Data / API

- **getPlanById(id):** Returns plan.
- **getPlanEntities(planId):** Returns list of entities selected for the plan (entity_number, entity_name, city, state, status, etc.).
- **getAvailableEntities(planId):** Returns or searches entities that can be added to the plan (for Add Grants modal).
- **addEntityToPlan(planId, entityId):** Adds entity to plan.
- **removeEntityFromPlan(planId, entityId):** Removes entity from plan.
- **updatePlanSectionStatus(planId, sectionId, status):** Updates section status (e.g. "Complete") for the plan.
