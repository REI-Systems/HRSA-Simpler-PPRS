# Getting Started

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|--------|
| **Python** | 3.11+ | Backend (Flask, psycopg2) |
| **Node.js** | 18+ | Frontend (Next.js) |
| **PostgreSQL** | 14+ | Or Docker (see below) |
| **Git** | — | Clone the repository |

Ensure `python` (or `python3`), `node`, `npm`, and optionally `psql` are on your PATH.

---

## Step 1: Clone the repository

```bash
git clone <repository-url>
cd HRSA-Simpler-PPRS
```

---

## Step 2: Start PostgreSQL

### Option A: Docker (recommended)

```bash
docker run -d --name postgres-local \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=rei_community_dev \
  -p 5432:5432 \
  postgres:15
```

Verify: `docker ps` should list `postgres-local`.

### Option B: Local PostgreSQL

- Install PostgreSQL 14+ and create a database and user, or:

```bash
psql -U postgres -c "CREATE USER admin WITH PASSWORD 'admin';"
psql -U postgres -c "CREATE DATABASE rei_community_dev OWNER admin;"
```

---

## Step 3: Backend setup

```bash
cd backend
```

1. **Virtual environment (recommended):**

   ```bash
   python -m venv venv
   # Windows (PowerShell): .\venv\Scripts\Activate.ps1
   # macOS/Linux: source venv/bin/activate
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Environment:**

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` (e.g. `postgresql://admin:admin@localhost:5432/rei_community_dev`) or Azure variables. See [Environment Configuration](Environment-Configuration).

4. **Create tables and seed:**

   ```bash
   python database/init_db.py
   python database/seed_data.py
   ```

5. **Load static data (menu, header nav, SVP config, plans):**

   ```bash
   psql "$DATABASE_URL" -f scripts/init_static_data.sql
   ```

   Windows (PowerShell):  
   `psql $env:DATABASE_URL -f scripts/init_static_data.sql`

6. **Start backend:**

   ```bash
   python app.py
   ```

   Backend runs at **http://localhost:3001**. Leave the terminal open.

---

## Step 4: Frontend setup

In a **new terminal** from the project root:

```bash
cd frontend
npm install
```

Set `NEXT_PUBLIC_BACKEND_URL` in `.env.local` if the backend is not at `http://localhost:3001`. Then:

```bash
npm run dev
```

Frontend runs at **http://localhost:3000**.

---

## Step 5: Verify

1. Open **http://localhost:3000/login**
2. Log in: **admin** / **admin**
3. You should see the welcome/home page.
4. Optional: **http://localhost:3001/health** or **http://localhost:3001/api/health** for backend health.

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Backend: connection refused / database unavailable | Ensure PostgreSQL is running. Check `.env` and `DATABASE_URL`. |
| Backend: relation does not exist | Run `init_db.py`, `seed_data.py`, and `scripts/init_static_data.sql`. |
| Windows: Unicode error in init_db | `$env:PYTHONIOENCODING = 'utf-8'` then re-run the Python scripts. |
| Frontend: API errors or CORS | Confirm backend is on port 3001 and frontend uses that URL. |
| Port in use | Change `PORT` in backend `.env` or run Next.js on another port (e.g. `npm run dev -- -p 3002`). |
