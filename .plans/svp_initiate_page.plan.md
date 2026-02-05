---
name: Site Visit Plan Initiate Page
route: /svp/initiate
overview: "Form to create a new site visit plan. Loads menu, header nav, and initiate options (team, plan-for, period options); on submit calls createPlan and redirects to /svp/status/[id]?created=1. Uses InitiatePlanForm inside AppLayout."
todos: []
isProject: false
---

# Site Visit Plan Initiate Page – Prompt for LLM

## Goal

Implement or modify the **Site Visit Plan Initiate** page at route `/svp/initiate` so that:
- User sees the app layout and a form to create a new plan (team, plan-for type, bureau/division/program, period type, fiscal/calendar year, plan name).
- Form options (dropdowns, etc.) are loaded from the backend via `getInitiateOptions()`.
- On submit: send payload to backend `POST /api/svp/plans` (via `createPlan`). On success redirect to `/svp/status/[id]?created=1`. On failure show submit error in the page (no redirect).
- Cancel button navigates back to `/svp`.

## Current State

- **Route:** `frontend/app/svp/initiate/page.js`.
- **Layout:** `AppLayout` with `menuItems`, `navItems`, `activeNavItem="tasks"`, `defaultExpandedMenuIds={['svp']}`.
- **Form:** `InitiatePlanForm` from `../../components/InitiatePlanForm`; receives `options` (from `getInitiateOptions()`), `onSubmit`, `onCancel`.
- **Submit handler:** Builds payload `{ team, planForType, bureau, division, program, periodType, fiscalYear, calendarYear, planName }` from form data; calls `createPlan(payload)`; on success redirects to `/svp/status/${created.id}?created=1`; on failure sets `submitError` and displays it in a red banner above the form.

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/svp/initiate/page.js` |
| Form component | `frontend/app/components/InitiatePlanForm/InitiatePlanForm.js` |
| Services | `getMenu`, `getHeaderNav`, `getInitiateOptions`, `createPlan` from `frontend/app/services` |
| Backend | `backend/routes/svp_initiate_routes.py`, `backend/services/svp_initiate_service.py`, plan creation in `backend/repositories/svp_plan_repository.py` (or equivalent) |

## Prompt-Style Instructions for Another LLM

1. **Load options and layout:** On mount, fetch `getMenu()`, `getHeaderNav()`, `getInitiateOptions()`. Pass options into `InitiatePlanForm`. Show loading until done; on error show a message and optionally still render form with empty options.
2. **Submit payload:** Map form fields to: `team`, `planForType`, `bureau`, `division`, `program`, `periodType`, `fiscalYear`, `calendarYear`, `planName`. Omit or send null for optional fields per backend contract.
3. **Success:** If `createPlan` returns an object with `id`, call `router.push('/svp/status/' + encodeURIComponent(created.id) + '?created=1')`. Do not show success message on this page; the status overview page will show the success banner.
4. **Error:** On catch or if response has no `id`, set `submitError` to a user-friendly message and render it above the form (e.g. red banner). Do not use `alert()`.
5. **Cancel:** `onCancel` should call `router.push('/svp')`.
6. **Backend contract:** Ensure `createPlan` in `svpService.js` POSTs to `/api/svp/plans` with JSON body and returns the created plan object including `id`.

## Data / API

- **getInitiateOptions():** Returns options for dropdowns (e.g. teams, plan-for types, periods).
- **createPlan(payload):** POST `/api/svp/plans` with payload; returns `{ id, plan_code?, plan_for, plan_period, plan_name, site_visits, status, sections?, ... }`. Frontend needs at least `id` for redirect.
