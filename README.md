# REI - Program performance Reporting Systems - Community Development Platform

A full-stack web application with authentication, built with Next.js frontend, Python/Flask backend, and PostgreSQL database.

**Documentation:** See the [wiki](wiki/) folder for wiki-style documentation (Architecture, Getting Started, Backend, Frontend, Database, SVP, API Reference, Deployment). You can use these pages as the source for the repository's [GitHub Wiki](https://github.com/REI-Systems/HRSA-Simpler-PPRS/wiki) — see [wiki/README.md](wiki/README.md) for instructions.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                  │
│  - Login Page with Authentication                       │
│  - Protected Welcome Page                               │
│  - Shared Header/Footer Components                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend (Python/Flask)                 │
│  - REST API (Login, Welcome)                            │
│  - Service Layer (Auth, Welcome)                        │
│  - Clean Architecture                                   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                Database (PostgreSQL)                    │
│  - Users Table                                          │
│  - Welcome Content Table                                │
└─────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
welcome-app/
├── backend/                    # Python Flask API
│   ├── config/                 # Database configuration
│   ├── database/               # DB initialization & seeding
│   ├── services/               # Business logic layer
│   ├── app.py                  # Main Flask application
│   ├── Dockerfile              # Backend container
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # Next.js application
│   ├── app/
│   │   ├── components/         # Reusable components (Header, Footer)
│   │   ├── login/              # Login page
│   │   ├── styles/             # Separated style files
│   │   ├── layout.js           # Root layout
│   │   └── page.js             # Welcome page (protected)
│   ├── public/
│   │   └── config.json         # Environment configuration
│   ├── Dockerfile              # Frontend container
│   └── package.json            # Node dependencies
│
└── .github/workflows/          # CI/CD pipelines

```

## 🚀 Quick Start

See [Detailed Local Setup](#-detailed-local-setup) below for step-by-step instructions. In short:

```bash
# 1. Start PostgreSQL (Docker or local install)
# 2. Backend: cd backend && pip install -r requirements.txt && cp .env.example .env && python database/init_db.py && python database/seed_data.py && python app.py
# 3. Frontend: cd frontend && npm install && npm run dev
# 4. Open http://localhost:3000/login (admin / admin)
```

---

## 📋 Detailed Local Setup

Follow these steps to run the application on your machine.

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|--------|
| **Python** | 3.11+ | For backend (Flask, psycopg2) |
| **Node.js** | 18+ | For frontend (Next.js) |
| **PostgreSQL** | 14+ | Or use Docker (see below) |
| **Git** | — | To clone the repository |

Ensure `python` (or `python3`), `node`, `npm`, and `psql` (if using local PostgreSQL) are on your PATH.

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd HRSA-Simpler-PPRS
```

### Step 2: Start PostgreSQL

You need a running PostgreSQL instance. Choose one option.

#### Option A: PostgreSQL via Docker (easiest)

```bash
docker run -d --name postgres-local \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=rei_community_dev \
  -p 5432:5432 \
  postgres:15
```

Verify it’s running: `docker ps` should list `postgres-local`.

#### Option B: Local PostgreSQL installation

- Install PostgreSQL 14+ (e.g. from [postgresql.org](https://www.postgresql.org/download/)).
- Create a database and user, or use default `postgres` and create DB:

```bash
psql -U postgres -c "CREATE USER admin WITH PASSWORD 'admin';"
psql -U postgres -c "CREATE DATABASE rei_community_dev OWNER admin;"
```

- Ensure the server is listening on `localhost:5432` (or set `DATABASE_URL` in Step 4 accordingly).

### Step 3: Backend Setup

```bash
cd backend
```

1. **Create a virtual environment (recommended):**

   ```bash
   python -m venv venv
   # Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # Windows (CMD):
   venv\Scripts\activate.bat
   # macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set the database connection:

   - **If using Docker PostgreSQL (Option A):** use default or:
     ```bash
     DATABASE_URL=postgresql://admin:admin@localhost:5432/rei_community_dev
     ```
   - **If using Azure PostgreSQL:** set `AZURE_DB_HOST`, `AZURE_DB_USER`, `AZURE_DB_PASSWORD`, `AZURE_DB_NAME`, `AZURE_DB_PORT` (see [Environment Configuration](#-environment-configuration)).
   - **Optional:** `PORT=3001` (backend port).

4. **Create tables and seed data:**

   ```bash
   python database/init_db.py
   python database/seed_data.py
   ```

   You should see success messages for each table and seed step.

   **Menu, header nav, SVP config, and SVP plans** come from the static data script. Run it against your database (same connection as in `.env`):

   ```bash
   # Using connection string from .env (replace with your DB URL if needed)
   psql "postgresql://admin:password@host:5432/rei_pprs_dev" -f scripts/init_static_data.sql
   ```

   Or set `DATABASE_URL` and run: `psql "$DATABASE_URL" -f scripts/init_static_data.sql` from the `backend` folder. The app reads from tables created by this script (`menu_item`, `header_nav_item`, `svp_plan`, etc.).

   - **Windows:** If you see `UnicodeEncodeError` when running `init_db.py`, set UTF-8 and run again:
     ```powershell
     $env:PYTHONIOENCODING = 'utf-8'
     python database/init_db.py
     python database/seed_data.py
     ```

5. **Start the backend:**

   ```bash
   python app.py
   ```

   Backend runs at **http://localhost:3001**. Leave this terminal open.

### Step 4: Frontend Setup

Open a **new terminal** in the project root:

```bash
cd frontend
```

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure backend URL (if needed):**

   - For local backend, the app typically uses `http://localhost:3001` (e.g. via `NEXT_PUBLIC_BACKEND_URL` or `config.json`).
   - If your backend runs on a different host/port, set `NEXT_PUBLIC_BACKEND_URL` in `.env.local` or update the frontend config used by your app.

3. **Start the frontend:**

   ```bash
   npm run dev
   ```

   Frontend runs at **http://localhost:3000**. Leave this terminal open.

### Step 5: Verify Setup

1. Open a browser and go to **http://localhost:3000/login**.
2. Log in with:
   - **Username:** `admin`  
   - **Password:** `admin`
3. You should see the welcome/home page after login.
4. Optional: check backend health: **http://localhost:3001/health** or **http://localhost:3001/api/health**.

### Troubleshooting

| Issue | What to try |
|-------|-------------|
| **Backend: "connection refused" or "database unavailable"** | Ensure PostgreSQL is running (`docker ps` or `pg_isready -h localhost -p 5432`). Check `.env` and `DATABASE_URL` (or Azure vars). |
| **Backend: "relation does not exist"** | Run `python database/init_db.py` and `python database/seed_data.py` for welcome/users. For menu, header nav, SVP data, run `psql "$DATABASE_URL" -f scripts/init_static_data.sql` from `backend`. |
| **Windows: Unicode error in init_db.py** | Run with `$env:PYTHONIOENCODING = 'utf-8'` before `python database/init_db.py` (and seed_data if needed). |
| **Frontend: API errors or CORS** | Confirm backend is running on port 3001 and that the frontend is configured to use `http://localhost:3001`. |
| **Port already in use** | Change `PORT` in backend `.env` (e.g. 3002) or use a different Next.js port (e.g. `npm run dev -- -p 3002`). |

---

### Option 2: Docker (Local PostgreSQL)

#### Prerequisites
- Docker Desktop installed and running
- Ports 3000, 3001, 5432 available

#### 1. Start PostgreSQL
```bash
docker run -d --name postgres-local \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=rei_community_dev \
  -p 5432:5432 \
  postgres:15
```

#### 2. Initialize Database
```bash
cd backend
docker build -t backend:latest .
docker run --rm --network host backend:latest python database/init_db.py
docker run --rm --network host backend:latest python database/seed_data.py
```

#### 3. Start Backend
```bash
docker run -d -p 3001:3001 \
  -e DATABASE_URL=postgresql://admin:admin@host.docker.internal:5432/rei_community_dev \
  --name backend-app \
  backend:latest
```

#### 4. Start Frontend
```bash
cd frontend
docker build -t frontend:latest .
docker run -d -p 3000:3000 --name frontend-app frontend:latest
```

#### 5. Access Application
- **Login Page:** http://localhost:3000/login
- **Credentials:** username: `admin`, password: `admin`

## 🔐 Authentication

### Test Users
| Username | Password | Email |
|----------|----------|-------|
| admin | admin | admin@reisystems.com |
| testuser | password | test@reisystems.com |

### API Endpoints

**POST /api/auth/login**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**GET /api/welcome**
```json
{
  "title": "Welcome to REI Systems",
  "message": "Community Development!",
  "timestamp": "2026-01-30T12:00:00.000000"
}
```

## 🎨 Design

**Color Scheme:**
- Header: `#193d58` (Dark Blue-Gray)
- Footer: `#414141` (Dark Gray)
- Accent: `#193d58`

**Branding:**
- HRSA Electronic Handbooks
- Government-style professional UI

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (React 18)
- Client-side routing
- Inline styles (separated by component)

**Backend:**
- Python 3.11
- Flask 3.0
- PostgreSQL driver (psycopg2)
- Clean architecture (routes → services → database)

**Database:**
- PostgreSQL 15
- Relational schema
- Seeded test data

**DevOps:**
- Docker containers
- GitHub Actions (CI/CD)
- Azure Container Registry
- Azure Container Instances

## 📝 Database Schema

Tables are created by `backend/database/init_db.py` and seeded by `backend/database/seed_data.py`.

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Welcome Table
```sql
CREATE TABLE welcome (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### App Config Table (menu, header_nav, svp_config, svp_initiate_options)
```sql
CREATE TABLE app_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL
);
```

### SVP Plans & Sections
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

CREATE TABLE svp_plan_sections (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES svp_plans(id) ON DELETE CASCADE,
    section_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Not Started'
);
```

## 📦 Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## ☁️ Azure Deployment

### Azure Resources

**Current Setup:**
- **Resource Group:** `RG-OpenSourcePOC`
- **PostgreSQL:** Azure Container Instance (`rei-pprs-postgres`)
- **Container Registry:** `reiopensourcepoc.azurecr.io`
- **Database:** `rei_pprs_dev`

### Database Setup (One-Time)

The Azure PostgreSQL database is already configured and running. Connection details:
```
Host: rei-pprs-db.bpfvc3g9bagkb3gj.eastus.azurecontainer.io
Port: 5432
Database: rei_pprs_dev
```

### GitHub Secrets Configuration

Required secrets in GitHub repository settings:
- `ACR_LOGIN_SERVER` - Azure Container Registry URL
- `ACR_USERNAME` - Registry username
- `ACR_PASSWORD` - Registry password
- `AZURE_DB_URL` - PostgreSQL connection string

### Deployment Workflow

Automated deployment via GitHub Actions:
1. Push code to `main` branch
2. GitHub Actions builds Docker images
3. Images pushed to Azure Container Registry
4. Containers deployed to Azure Container Instances

See `.github/workflows/` for CI/CD pipeline configuration.

## 🔧 Environment Configuration

### Backend (.env)

```bash
# Azure PostgreSQL Configuration
AZURE_DB_HOST=rei-pprs-db.bpfvc3g9bagkb3gj.eastus.azurecontainer.io
AZURE_DB_USER=admin
AZURE_DB_PASSWORD=your-password
AZURE_DB_NAME=rei_pprs_dev
AZURE_DB_PORT=5432

# Backend Port
PORT=3001
```

### Frontend (config.json)

```json
{
  "environments": {
    "local": {
      "backendUrl": "http://localhost:3001"
    },
    "azure": {
      "backendUrl": "http://your-backend.azurecontainer.io:3001"
    }
  },
  "activeEnvironment": "local"
}
```

## 🚢 Deployment

### Manual Deployment

```bash
# Build and push backend
cd backend
docker build -t reiopensourcepoc.azurecr.io/hrsa-backend:latest .
docker push reiopensourcepoc.azurecr.io/hrsa-backend:latest

# Build and push frontend
cd frontend
docker build -t reiopensourcepoc.azurecr.io/hrsa-frontend:latest .
docker push reiopensourcepoc.azurecr.io/hrsa-frontend:latest
```

## 📄 License

© 2026 REI Systems. All rights reserved.
