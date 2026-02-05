---
name: Welcome Page
route: /welcome
overview: "Dashboard hub after login. Uses AppLayout with menu and header nav; loads menu, header nav, SVP plans list, and welcome message from APIs; renders WelcomePageContent with plans, welcome message, loading and error states."
todos: []
isProject: false
---

# Welcome Page – Prompt for LLM

## Goal

Implement or modify the **Welcome** page at route `/welcome` so that:
- It shows the main application layout (sidebar menu, header) with active nav item "home" and SVP menu expanded.
- It fetches: menu items, header nav items, list of site visit plans (optionally filtered by current user), and welcome message.
- It renders `WelcomePageContent` with plans, welcome message, and loading/error state. No redirect unless you explicitly add one.

## Current State

- **Route:** `frontend/app/welcome/page.js`.
- **Layout:** `AppLayout` with `menuItems`, `navItems`, `activeNavItem="home"`, `defaultExpandedMenuIds={['svp']}`.
- **Data loading:** `Promise.all([getMenu(), getHeaderNav(), getPlans(getStoredUsername()), getWelcomeMessage().catch(() => null)])`. Plans may be filtered by username when backend supports it; welcome message is optional (null on failure).
- **Component:** `WelcomePageContent` from `../components/Welcome` receives `plans`, `welcomeMessage`, `loading`, `error`.

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/welcome/page.js` |
| Content component | `frontend/app/components/Welcome/WelcomePageContent.js` (and module CSS, index) |
| Layout | `frontend/app/components/Layout/AppLayout.js` |
| Services | `frontend/app/services/index.js` — `getMenu`, `getHeaderNav`, `getPlans`, `getWelcomeMessage`, `getStoredUsername` |
| Backend | `backend/routes/welcome_routes.py`, `backend/routes/layout_routes.py`, `backend/routes/svp_list_routes.py` |

## Prompt-Style Instructions for Another LLM

1. **Layout:** Keep using `AppLayout` so the welcome page matches the rest of the app (sidebar, header). Pass `activeNavItem="home"` so "Home" is highlighted in the header.
2. **Fetch on mount:** Load menu, header nav, plans, and welcome message in one `Promise.all`. If `getWelcomeMessage` fails, treat as no message (null); do not fail the whole page.
3. **Plans and user:** `getPlans(username)` may pass the stored username for backend filtering; ensure `getStoredUsername()` is only called in browser (e.g. `typeof window !== 'undefined' ? getStoredUsername() : null`).
4. **Loading and error:** Show a loading state until all requests resolve; on error set `error` and display it in the layout. Pass `loading` and `error` into `WelcomePageContent` so the component can show spinners or error messages.
5. **Refresh:** If you add a refresh control, call the same fetch function again and update state (the current code uses a single `fetchData` in `useEffect`).

## Data / API

- **getMenu():** Returns menu tree (e.g. from layout API).
- **getHeaderNav():** Returns header nav items.
- **getPlans(username?):** Returns list of SVP plans; optional user filter.
- **getWelcomeMessage():** Returns welcome text or null; may 404 or fail.
