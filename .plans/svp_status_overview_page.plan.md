---
name: Site Visit Plan Status Overview Page
route: /svp/status/[id]
overview: "Status overview for a single site visit plan. Shows success banner when created=1, plan details and resources (collapsible), plan section status table with Update actions that navigate to coversheet, selected entities, identified site visits, or basic info. Footer: Return to List, Cancel Plan, Request Approval."
todos: []
isProject: false
---

# Site Visit Plan Status Overview Page – Prompt for LLM

## Goal

Implement or modify the **Site Visit Plan Status Overview** page at route `/svp/status/[id]` so that:
- It loads the plan by id via `getPlanById(id)` and displays plan summary, collapsible "Plan Details" and "Resources," and a table of section statuses (Cover Sheet, Selected Entities, Identified Site Visits, etc.) with status and "Update" action per section.
- When opened with query `?created=1`, show a success banner (e.g. "Plan created successfully") that auto-dismisses after a few seconds.
- Section "Update" actions navigate to the correct sub-page: Cover Sheet → `/svp/status/[id]/coversheet`, Selected Entities → `/svp/status/[id]/selected-entities`, Identified Site Visits → `/svp/status/[id]/identified-site-visits`, Basic Info → `/svp/status/[id]/basic-info/[entityId]` (entityId may come from context or first entity).
- Footer has "Return to List" (→ `/svp`), "Cancel Plan," and "Request Approval" (actions may be stubs).
- Optionally call `recordPlanAccess(id)` for analytics or last-accessed tracking.

## Current State

- **Route:** `frontend/app/svp/status/[id]/page.js`.
- **Component:** `SiteVisitPlanStatusOverview` in `frontend/app/components/SiteVisitPlanStatusOverview/`; receives `planId` and `showSuccessBanner` (derived from `searchParams.get('created') === '1'`).
- **Data:** Component fetches plan with `getPlanById(planId)`; plan includes `sections` array with `id`, `name`, `status`. Component maps section id to route for Update (e.g. `cover_sheet` → coversheet, `selected_entities` → selected-entities, `identified_site_visits` → identified-site-visits; basic info may use entity id from plan or first selected entity).
- **Layout:** `AppLayout` with menu, header, `activeNavItem="tasks"`, `defaultExpandedMenuIds={['svp']}`.

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/svp/status/[id]/page.js` |
| Overview component | `frontend/app/components/SiteVisitPlanStatusOverview/SiteVisitPlanStatusOverview.js`, module CSS |
| Services | `getMenu`, `getHeaderNav`, `recordPlanAccess`, `getPlanById` from `frontend/app/services` |
| Backend | `backend/routes/svp_status_routes.py` — GET plan by id |

## Prompt-Style Instructions for Another LLM

1. **Plan id:** Read `params.id` from `useParams()`. If missing, show error and do not fetch. Pass `planId` to `SiteVisitPlanStatusOverview`.
2. **Success banner:** Set `showSuccessBanner = searchParams.get('created') === '1'` and pass to the component. Component should show a green success message and hide it after ~5 seconds.
3. **Section navigation:** In the component, when user clicks "Update" for a section, navigate: `cover_sheet` → `/svp/status/[id]/coversheet`, `selected_entities` → `/svp/status/[id]/selected-entities`, `identified_site_visits` → `/svp/status/[id]/identified-site-visits`. For basic info, if you have an entity id (e.g. from plan or selected entities), use `/svp/status/[id]/basic-info/[entityId]`; otherwise you may need to pick first entity or show a list.
4. **Layout and loading:** Use `AppLayout`; show loading until menu/nav and plan are ready. On 404 or fetch error, show error state in the main content area.
5. **Refetch on focus:** Optionally refetch plan when window gains focus so returning from a sub-page shows updated section statuses.
6. **recordPlanAccess:** Call `recordPlanAccess(id)` in the page or component when plan id is available (e.g. in useEffect) if the backend supports it.

## Data / API

- **getPlanById(id):** GET `/api/svp/plans/[id]` returns plan with `id`, `plan_code`, `plan_name`, `plan_for`, `plan_period`, `site_visits`, `status`, `sections: [{ id, name, status }]`, etc.
- **recordPlanAccess(id):** Optional POST or GET to record that the user opened this plan.
