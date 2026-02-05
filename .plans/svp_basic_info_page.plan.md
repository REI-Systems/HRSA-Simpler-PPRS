---
name: Site Visit Plan Basic Info Page
route: /svp/status/[id]/basic-info/[entityId]
overview: "Basic information for one entity within a plan: justification, tracking number, grant label, site visit details, options from backend, and travel plans grid. Save actions (e.g. Mark Complete) call updateBasicInfo; on success refetches plan and basic info. Uses AppLayout and SiteVisitPlanBasicInfo."
todos: []
isProject: false
---

# Site Visit Plan Basic Info Page – Prompt for LLM

## Goal

Implement or modify the **Site Visit Plan Basic Info** page at route `/svp/status/[id]/basic-info/[entityId]` so that:
- It loads the plan by id, basic info for the given entity by entityId, and options (dropdowns: additional programs, site visit locations, reason types, site visit types, areas of review, roles, prioritization, etc.).
- It displays the basic info form and a travel plans grid. User can edit fields and run actions (e.g. Save, Mark Complete). On success, backend is called and the page refetches data.
- Layout uses AppLayout; active nav "tasks," SVP menu expanded.

## Current State

- **Route:** `frontend/app/svp/status/[id]/basic-info/[entityId]/page.js`.
- **Params:** `id` (plan id), `entityId` (entity id).
- **Component:** `SiteVisitPlanBasicInfo` receives `planId`, `entityId`, `plan`, `basicInfo`, `options`, `onSaveSuccess`.
- **Data:** Page fetches `getMenu()`, `getHeaderNav()`, `getPlanById(id)`, `getBasicInfo(id, entityId)`, `getBasicInfoOptions()`. Passes all to component.
- **Component:** Uses `updateBasicInfo(planId, entityId, { action })` for save actions; justification and other fields may be sent in payload. Travel plans displayed in DataGrid with columns: number_of_travelers, travel_locations, travel_dates, travelers, travel_cost, status, options.

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/svp/status/[id]/basic-info/[entityId]/page.js` |
| Basic info component | `frontend/app/components/SiteVisitPlanBasicInfo/SiteVisitPlanBasicInfo.js`, module CSS |
| Services | `getMenu`, `getHeaderNav`, `getPlanById`, `getBasicInfo`, `getBasicInfoOptions`, `updateBasicInfo` (from `svpService`) |
| Backend | `backend/routes/basic_info_routes.py`, `backend/services/basic_info_service.py`, `backend/repositories/basic_info_repository.py` |

## Prompt-Style Instructions for Another LLM

1. **Route params:** Read `params.id` and `params.entityId` from `useParams()`. If either is missing, show error. Fetch plan, basic info, and options in parallel with menu and header nav.
2. **Layout:** Use `AppLayout` with `menuItems`, `navItems`, `activeNavItem="tasks"`, `defaultExpandedMenuIds={['svp']}`.
3. **Refetch on save:** Pass `onSaveSuccess={loadData}` so that after a successful save the page refetches plan, basic info, and optionally options (if they can change).
4. **Options shape:** `options` typically includes `additional_programs`, `site_visit_locations`, `reason_types`, `site_visit_types_primary`, `site_visit_types_secondary`, `areas_of_review`, `roles`, `prioritization`. Component uses these for dropdowns and multi-selects.
5. **Basic info shape:** `basicInfo` includes `justification`, `tracking_number`, `grant_label`, `site_visit_initiated_for`, `travel_plans` (array for grid), and other fields. Backend uses snake_case.
6. **Navigation:** Provide a link or button back to status overview or to identified site visits (e.g. from status overview, "Edit Basic Information" for an entity links here with that entity's id).
7. **404:** If plan or entity is not found (404 from getPlanById or getBasicInfo), show "Plan or entity not found."

## Data / API

- **getPlanById(id):** Returns plan object.
- **getBasicInfo(planId, entityId):** Returns basic info for that entity (justification, tracking_number, grant_label, travel_plans, etc.).
- **getBasicInfoOptions():** Returns options for all dropdowns and selects.
- **updateBasicInfo(planId, entityId, payload):** Payload may include `action` (e.g. mark_complete), `justification`, and other form fields. Returns success or updated basic info.
