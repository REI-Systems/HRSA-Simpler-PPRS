---
name: Home Page
route: /
overview: "Root route that redirects unauthenticated users to /login and authenticated users to /welcome. Renders nothing; navigation is handled in useEffect."
todos: []
isProject: false
---

# Home Page – Prompt for LLM

## Goal

Implement or modify the **Home** page at route `/` so that:
- If no user is stored in `localStorage` under key `user`, redirect to `/login`.
- If a user is present, redirect to `/welcome`.
- The page itself renders nothing (or a minimal loading state) while the redirect is applied.

## Current State

- **Route:** Next.js App Router root at `frontend/app/page.js`.
- **Behavior:** `useEffect` runs once (with `[router]` dependency), reads `localStorage.getItem('user')`, then calls `router.push('/login')` or `router.push('/welcome')`. Component returns `null`.
- **Dependencies:** `useRouter` from `next/navigation`, `useEffect` from React.

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/page.js` |
| Auth storage | `localStorage` key `user` (set by Login page after successful auth) |

## Prompt-Style Instructions for Another LLM

1. **Preserve redirect logic:** The home page must remain a thin router: no form, no main content. Only decide where to send the user and call `router.push(...)`.
2. **Auth check:** Use `localStorage.getItem('user')`. No backend call is required for this page. If you add a different auth mechanism (e.g. cookie or session), update this check to match.
3. **Avoid flash of content:** Returning `null` is acceptable. If you need a loading spinner, show it only briefly and ensure redirect happens as soon as the check is done.
4. **Testing:** Verify that from `/`, unauthenticated users land on `/login` and authenticated users (with `user` in localStorage) land on `/welcome`.

## Data / API

- No API calls. No props. Relies only on `localStorage` and Next.js `useRouter`.
