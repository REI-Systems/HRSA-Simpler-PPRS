---
name: Login Page
route: /login
overview: "Login page with username/password form. POSTs to backend /api/auth/login; on success stores user in localStorage and redirects to /. Uses LayoutProvider, Header, Footer, and inline login styles."
todos: []
isProject: false
---

# Login Page – Prompt for LLM

## Goal

Implement or modify the **Login** page at route `/login` so that:
- User can enter username and password and submit.
- Form POSTs to the backend at `POST /api/auth/login` with `{ username, password }`.
- On success: store `data.user` in `localStorage` under key `user` (as JSON) and redirect to `/` (which then sends authenticated users to `/welcome`).
- On failure: display an error message (invalid credentials, server error, or connection error) without redirecting.
- Page uses app Header and Footer and a centered login card; no sidebar/menu.

## Current State

- **Route:** `frontend/app/login/page.js`.
- **Backend:** `backend/routes/auth_routes.py` — `POST /api/auth/login`; returns `{ success, user }` on success or `{ success: false, message }` on failure.
- **UI:** Lock icon, "Log In" title, username/password inputs, "Sign In" button, "Forgot Password?" and "Request New Account" links. Error message shown above form when `error` state is set.
- **Backend URL:** Resolved via `getLoginBackendUrl()` — uses `NEXT_PUBLIC_BACKEND_URL` but falls back to `http://localhost:3001` if env is same as frontend origin (to avoid hitting Next.js instead of backend).

## Key Files

| Role | Path |
|------|------|
| Page component | `frontend/app/login/page.js` |
| Styles | `frontend/app/styles/login.styles.js` |
| Layout | `LayoutProvider`, `Header`, `Footer` from `../contexts/LayoutContext`, `../components/Header/Header`, `../components/Footer` |
| Backend auth | `backend/routes/auth_routes.py`, `backend/services/auth_service.py` |

## Prompt-Style Instructions for Another LLM

1. **Form submit:** On submit, call `POST ${backendUrl}/api/auth/login` with JSON body `{ username, password }`. Handle non-JSON responses (e.g. 502/503 HTML) and set a generic "Server is not responding" message.
2. **Success path:** If `response.ok && data.success`, run `localStorage.setItem('user', JSON.stringify(data.user))` then `router.push('/')`.
3. **Error handling:** For 401/400 use `data.message` or "Invalid username or password". For 5xx or network errors use a server/connection message. Set `error` state and show it in the UI; do not redirect.
4. **Loading state:** Disable inputs and show "Signing in..." on the button while the request is in flight.
5. **Validation:** Require both username and password; if either is empty, set error and do not call the API.
6. **Backend URL:** Keep the logic that avoids using the frontend origin as the API base (so backend is always targeted when env points to same origin).

## Data / API

- **Request:** `POST /api/auth/login` body `{ username: string, password: string }`.
- **Success response:** `{ success: true, user: object }`.
- **Error response:** `{ success: false, message?: string }` or non-JSON (treat as server/connection error).
