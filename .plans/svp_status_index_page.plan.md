---
name: Site Visit Plan Status Index Page
route: /svp/status
overview: "Placeholder route for /svp/status with no plan id. Immediately redirects to /svp (plan list) so users open a specific plan from the list at /svp/status/[id]."
todos: []
isProject: false
---

# Site Visit Plan Status Index Page – Prompt for LLM

## Goal

Implement or modify the **Site Visit Plan Status Index** page at route `/svp/status` (no plan id) so that:
- It does not render any content.
- It immediately redirects the user to `/svp` (the plan list) using `router.replace('/svp')` so the URL is replaced and users cannot get stuck on a status page with no plan.

## Current State

- **Route:** `frontend/app/svp/status/page.js`.
- **Behavior:** `useEffect` runs once and calls `router.replace('/svp')`. Component returns `null`.
- **Purpose:** The left menu may link to "Prepare" or "Status" at `/svp/status`; this page ensures users without a plan id are sent to the list to choose a plan. The actual status overview is at `/svp/status/[id]`.

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/svp/status/page.js` |

## Prompt-Style Instructions for Another LLM

1. **Redirect only:** This page should perform no API calls and show no UI. Use `useRouter()` from `next/navigation` and `router.replace('/svp')` in a `useEffect` with `[router]` dependency so the redirect happens once on mount.
2. **Replace vs push:** Use `replace` so the browser back button does not return to `/svp/status` (which would redirect again).
3. **No plan id:** Do not add logic for reading a plan id here; the dynamic route for a single plan is `app/svp/status/[id]/page.js`.

## Data / API

- No API calls. No props. No localStorage.
