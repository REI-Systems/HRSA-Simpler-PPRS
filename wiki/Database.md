# Database

PostgreSQL is used for all persistent data. Tables are created by Python scripts and by a SQL script for static/config data.

---

## Creation order

1. **`backend/database/init_db.py`** — Creates core tables:
   - `users`
   - `welcome`
   - `app_config`
   - `svp_plans`
   - `svp_plan_sections`

2. **`backend/database/seed_data.py`** — Seeds users and welcome content.

3. **`backend/scripts/init_static_data.sql`** — Creates and populates:
   - `menu_item`, `menu_item_child`
   - `header_nav_item`
   - `svp_column`, `svp_center_align_column`, `svp_row_action`
   - `svp_search_field`, `svp_default_search_values`
   - `svp_plan` (static plan data, if used)
   - `svp_initiate_option` (options for initiate form)

Run with:

```bash
psql "$DATABASE_URL" -f scripts/init_static_data.sql
```

---

## Core schema (init_db.py)

### users

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### welcome

```sql
CREATE TABLE welcome (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### app_config

```sql
CREATE TABLE app_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL
);
```

### svp_plans

```sql
CREATE TABLE svp_plans (
    id SERIAL PRIMARY KEY,
    plan_code VARCHAR(50) NOT NULL,
    plan_for TEXT,
    plan_period TEXT,
    plan_name TEXT,
    site_visits VARCHAR(20) DEFAULT '0',
    status VARCHAR(50) DEFAULT 'In Progress',
    team_name TEXT,
    needs_attention TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### svp_plan_sections

```sql
CREATE TABLE svp_plan_sections (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES svp_plans(id) ON DELETE CASCADE,
    section_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Not Started'
);
```

---

## Static/config schema (init_static_data.sql)

- **menu_item** — Sidebar menu parent (id, label, expanded, sort_order).
- **menu_item_child** — Menu children (child_id, label, href, is_header, sort_order).
- **header_nav_item** — Header links (id, label, href, sort_order).
- **svp_column** — Grid columns (key, label, filterable, filter_type, filter_options, sort_order).
- **svp_center_align_column** — Column indices to center-align.
- **svp_row_action** — Row action buttons (id, label, icon_left, icon_right, category, separator, sort_order).
- **svp_search_field** — Search form fields (key, label, type, options, filterable, sort_order).
- **svp_default_search_values** — Default search values (single row).
- **svp_plan** — Plan records (id, plan_for, plan_period, plan_name, site_visits, status, team_name, needs_attention).
- **svp_initiate_option** — Dropdown/lookup options for the initiate form.

---

## Connection

The backend uses `config/database.py` and reads the connection from environment variables (e.g. `DATABASE_URL` or `AZURE_DB_*`). See [Environment Configuration](Environment-Configuration).
