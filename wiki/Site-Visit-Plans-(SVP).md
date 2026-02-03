# Site Visit Plans (SVP)

The **Site Visit Plan (SVP)** feature provides list, initiate, and status-overview flows for managing site visit plans.

---

## Pages and routes

| Route | Page | Description |
|-------|------|-------------|
| `/svp` | SVP List | DataGrid of plans with search/filters and row actions |
| `/svp/initiate` | Initiate Plan | Form to create a new plan (options from API) |
| `/svp/status` | SVP Status list | List of plans for status view |
| `/svp/status/[id]` | SVP Status Overview | Status overview for a single plan (sections, details) |

---

## Backend

- **List:** `GET /api/svp/plans` — implemented via `data_repository.get_svp_plans()`.
- **Create:** `POST /api/svp/plans` — `data_repository.create_svp_plan(body)`.
- **Single plan:** `GET /api/svp/plans/<id>` — `data_repository.get_svp_plan_by_id(plan_id)`.
- **Config:** `GET /api/svp/config` — columns, search fields, row actions, default values (from `svp_column`, `svp_search_field`, etc.).
- **Initiate options:** `GET /api/svp/initiate/options` — dropdown/lookup options from `svp_initiate_option` (or equivalent).

Static/config tables (menu, header, SVP columns, search fields, row actions, initiate options) are created and seeded by `backend/scripts/init_static_data.sql`.

---

## Frontend

- **svpService.js** — `getPlans()`, `getPlanById()`, `createPlan()`, `getConfig()`, `getInitiateOptions()`.
- **SiteVisitPlanList** — Renders DataGrid with config from `/api/svp/config`, data from `/api/svp/plans`, and SearchModal for filters.
- **InitiatePlanForm** — Form fields driven by `/api/svp/initiate/options`; submit calls `createPlan()` then navigates (e.g. to list or status).
- **SiteVisitPlanStatusOverview** — Fetches one plan by `id` and displays sections/status.

---

## Data model (conceptual)

- **Plan:** plan_code, plan_for, plan_period, plan_name, site_visits, status, team_name, needs_attention.
- **Sections:** per-plan sections (e.g. Cover Sheet, Selected Entities, Identified Site Visits) with status (Not Started, In Progress, Complete).

Default sections are defined in `data_repository.DEFAULT_SECTIONS` when creating a new plan.
