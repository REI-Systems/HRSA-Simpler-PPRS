# Architecture

## High-level overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                  │
│  - Login with Authentication                            │
│  - Protected Welcome / Home Page                        │
│  - Site Visit Plan List, Initiate, Status Overview      │
│  - Shared Header, Footer, Sidebar, Layout               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend (Python/Flask)                 │
│  - REST API (Auth, Welcome, Menu, SVP)                  │
│  - Service Layer (Auth, Welcome)                        │
│  - Data Repository (DB access)                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                Database (PostgreSQL)                    │
│  - users, welcome                                       │
│  - app_config (JSONB)                                   │
│  - svp_plans, svp_plan_sections                         │
│  - menu_item, header_nav_item, svp_* (static config)    │
└─────────────────────────────────────────────────────────┘
```

---

## Project structure

```
HRSA-Simpler-PPRS/
├── backend/                    # Python Flask API
│   ├── config/                 # Database configuration
│   ├── database/               # init_db.py, seed_data.py
│   ├── scripts/                # init_static_data.sql
│   ├── services/               # Business logic (auth, welcome)
│   ├── app.py                  # Flask app and routes
│   ├── data_repository.py      # Data access layer
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                   # Next.js application
│   ├── app/
│   │   ├── components/         # Header, Footer, Sidebar, DataGrid, SVP, etc.
│   │   ├── contexts/           # LayoutContext
│   │   ├── login/              # Login page
│   │   ├── svp/                # SVP list, initiate, status
│   │   ├── services/           # api, authService, svpService, etc.
│   │   ├── styles/
│   │   ├── layout.js
│   │   └── page.js             # Welcome / home
│   ├── public/
│   └── package.json
│
├── .github/workflows/          # CI/CD (build-docker.yml)
└── docs/                       # Prompts and documentation
```

---

## Design principles

- **Repository pattern**: Data access is centralized in `data_repository.py`; services and routes do not execute raw SQL.
- **Service layer**: Business logic lives in `backend/services/` (e.g. `auth_service`, `welcome_service`).
- **Snake_case**: Database columns use `snake_case` per project conventions.
- **Clean separation**: Routes → services → repository → database.

---

## Data flow (example: SVP list)

1. **Frontend**: `svpService.getPlans()` → `apiGet('/api/svp/plans')`
2. **Backend**: `app.py` route → `get_svp_plans()` from `data_repository`
3. **Repository**: Connects to PostgreSQL, reads `svp_plan` / plan tables, returns list
4. **Response**: JSON `{ "plans": [...] }` back to frontend

See [Backend](Backend), [Frontend](Frontend), and [Site Visit Plans (SVP)](Site-Visit-Plans-(SVP)) for details.
