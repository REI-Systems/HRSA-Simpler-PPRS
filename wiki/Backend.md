# Backend

The backend is a **Python Flask** API that serves REST endpoints for authentication, welcome content, menu, header nav, and Site Visit Plan (SVP) data. It uses a **repository pattern** and **service layer** for business logic.

---

## Stack

- **Python** 3.11+
- **Flask** 3.0
- **flask-cors** 4.0
- **psycopg2-binary** (PostgreSQL)
- **python-dotenv** (environment)

---

## Structure

| Path | Purpose |
|------|---------|
| `app.py` | Flask app, CORS, route definitions |
| `config/database.py` | DB connection (from `.env`) |
| `data_repository.py` | All DB access (menu, header_nav, SVP, welcome) |
| `services/auth_service.py` | Login validation |
| `services/welcome_service.py` | Welcome message from DB |
| `database/init_db.py` | Create `users`, `welcome`, `app_config`, `svp_plans`, `svp_plan_sections` |
| `database/seed_data.py` | Seed users and welcome content |
| `scripts/init_static_data.sql` | Menu, header nav, SVP config tables and static data |

---

## Routes (summary)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | Logout (stateless; client clears state) |
| GET | `/api/welcome` | Welcome title and message |
| GET | `/api/menu` | Sidebar menu items |
| GET | `/api/layout/header-nav` | Header navigation items |
| GET | `/api/svp/plans` | List site visit plans |
| POST | `/api/svp/plans` | Create a new plan |
| GET | `/api/svp/plans/<id>` | Get plan by ID |
| GET | `/api/svp/config` | SVP grid/search config |
| GET | `/api/svp/initiate/options` | Options for initiate form |
| GET | `/health`, `/api/health` | Health check |

See [API Reference](API-Reference) for request/response details.

---

## Flow

1. **Routes** in `app.py` receive HTTP requests and call repository or services.
2. **Services** (e.g. `authenticate_user`) contain business logic and use the repository or DB where needed.
3. **Repository** (`data_repository.py`) opens connections, runs queries, and returns dicts/lists. No business logic.

---

## Running

```bash
cd backend
pip install -r requirements.txt
# Configure .env, run init_db.py, seed_data.py, init_static_data.sql
python app.py
```

Default port: **3001** (override with `PORT` in `.env`).
