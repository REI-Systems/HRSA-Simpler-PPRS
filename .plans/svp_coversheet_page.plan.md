---
name: Site Visit Plan Coversheet Page
route: /svp/status/[id]/coversheet
overview: "Coversheet for a single SVP plan: plan name, plan description editor, and attachments (upload/list/delete). Save, Save and Continue, and Mark Complete actions call backend; on success refetches plan and optionally navigates. Uses AppLayout and SiteVisitPlanCoversheet component."
todos: []
isProject: false
---

# Site Visit Plan Coversheet Page – Prompt for LLM

## Goal

Implement or modify the **Site Visit Plan Coversheet** page at route `/svp/status/[id]/coversheet` so that:
- It loads the plan by id and displays the coversheet form: plan name (editable), plan description (rich text or textarea), and attachments list with upload and delete.
- User can save (Save, Save and Continue, or Mark Complete). Backend is called to update coversheet and optionally section status; on success the page refetches the plan and may navigate (e.g. Save and Continue → selected entities or next section).
- Layout uses AppLayout with sidebar and header; active nav "tasks," SVP menu expanded.

## Current State

- **Route:** `frontend/app/svp/status/[id]/coversheet/page.js`.
- **Component:** `SiteVisitPlanCoversheet` receives `plan`, `onSaveSuccess` (callback to refetch plan, e.g. `loadPlan`).
- **Data:** Page fetches `getMenu()`, `getHeaderNav()`, `getPlanById(id)`; passes `plan` to component. Component uses `updateCoversheet`, `getCoversheetAttachments`, `uploadCoversheetAttachment`, `deleteCoversheetAttachment` from `svpService`.
- **Form:** Plan name and plan description (supports both `plan_description` and `planDescription` for backend compatibility). Attachments: max file size (e.g. 25MB), max count (e.g. 10); upload and delete via API.
- **Actions:** Save, Save and Continue, Mark Complete; component sends `action` to backend and shows save status; `onSaveSuccess` refetches plan so parent can update state.

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/svp/status/[id]/coversheet/page.js` |
| Coversheet component | `frontend/app/components/SiteVisitPlanCoversheet/SiteVisitPlanCoversheet.js`, module CSS |
| Plan description editor | `frontend/app/components/PlanDescriptionEditor/PlanDescriptionEditor.js` |
| Services | `getMenu`, `getHeaderNav`, `getPlanById` from services; `updateCoversheet`, `getCoversheetAttachments`, `uploadCoversheetAttachment`, `deleteCoversheetAttachment` from `svpService.js` |
| Backend | `backend/routes/coversheet_routes.py`, `backend/services/coversheet_service.py`, `backend/repositories/coversheet_repository.py` |

## Prompt-Style Instructions for Another LLM

1. **Route params:** Read `params.id` from `useParams()`. If missing, show error. Fetch plan with `getPlanById(id)`; on 404 show "Plan not found."
2. **Layout:** Use `AppLayout` with `menuItems`, `navItems`, `activeNavItem="tasks"`, `defaultExpandedMenuIds={['svp']}`. Load menu and header nav in parallel with plan.
3. **Refetch on save:** Pass `onSaveSuccess={loadPlan}` so that after a successful save the plan is refetched and the component receives updated `plan` (e.g. updated plan_name, plan_description, section status).
4. **Component contract:** `SiteVisitPlanCoversheet` expects `plan` (object with id, plan_name, plan_description/planDescription, etc.) and `onSaveSuccess` (function). Component handles its own loading state for attachments and save status.
5. **Backend:** Coversheet update typically PATCH or PUT with plan_id, plan_name, plan_description, and optional action (save, save_and_continue, mark_complete). Attachments: GET list, POST upload, DELETE by id. Use snake_case for DB columns per project rules.
6. **Navigation:** If "Save and Continue" is used, component may call `router.push` to e.g. `/svp/status/[id]/selected-entities`; ensure route exists and is documented in status overview plan.

## Data / API

- **getPlanById(id):** Returns plan including `plan_name`, `plan_description` (or `planDescription`).
- **updateCoversheet(planId, payload):** Payload may include `plan_name`, `plan_description`, `action`. Returns updated plan or success.
- **getCoversheetAttachments(planId):** Returns list of attachments.
- **uploadCoversheetAttachment(planId, file):** Upload file; respect max size and max count.
- **deleteCoversheetAttachment(planId, attachmentId):** Remove attachment.
