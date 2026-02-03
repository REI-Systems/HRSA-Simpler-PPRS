# Frontend

The frontend is a **Next.js 14** (React 18) application with client-side routing, shared layout (header, footer, sidebar), login, welcome page, and **Site Visit Plan (SVP)** list, initiate, and status overview.

---

## Stack

- **Next.js** 16.x (App Router)
- **React** 18

---

## Structure

| Path | Purpose |
|------|---------|
| `app/layout.js` | Root layout |
| `app/page.js` | Welcome / home (protected) |
| `app/login/page.js` | Login page |
| `app/svp/page.js` | SVP list |
| `app/svp/initiate/page.js` | Initiate new plan |
| `app/svp/status/page.js` | SVP status list |
| `app/svp/status/[id]/page.js` | SVP status overview for one plan |
| `app/components/` | Header, Footer, Sidebar, Layout, DataGrid, SearchModal, SVP components |
| `app/contexts/LayoutContext.js` | Layout state |
| `app/services/` | api, authService, layoutService, menuService, svpService |
| `app/styles/` | Shared style objects (e.g. header, footer) |
| `public/` | Static assets (e.g. images, left-menu.json) |

---

## Key components

| Component | Role |
|-----------|------|
| **AppLayout** | Wraps content with Header, Sidebar, Footer |
| **Header** | Logo, title, header nav from API |
| **Sidebar** | Menu from API, highlights active route |
| **Footer** | Footer content and styling |
| **DataGrid** | Generic grid for SVP list (columns, filters, actions) |
| **SearchModal** | Search/filter modal for SVP |
| **SiteVisitPlanList** | SVP list page content |
| **InitiatePlanForm** | Form to create a new SVP |
| **SiteVisitPlanStatusOverview** | Status overview for a single plan |

---

## Services

| Service | Purpose |
|---------|---------|
| `api.js` | Base `apiGet`, `apiPost` with backend URL and error handling |
| `authService.js` | Login, logout, token/session handling |
| `layoutService.js` | Menu, header nav from API |
| `menuService.js` | Menu data for sidebar |
| `svpService.js` | getPlans, getPlanById, createPlan, getConfig, getInitiateOptions |

---

## Routing

- `/` — Home (welcome), protected
- `/login` — Login
- `/svp` — Site Visit Plan list
- `/svp/initiate` — Initiate new plan
- `/svp/status` — SVP status list
- `/svp/status/[id]` — SVP status overview for plan `id`

---

## Running

```bash
cd frontend
npm install
npm run dev
```

Runs at **http://localhost:3000**. Set `NEXT_PUBLIC_BACKEND_URL` in `.env.local` if the API is not at `http://localhost:3001`.
