# REI - PPRS - POC - Community Development Platform

A full-stack web application with authentication, built with **Next.js** frontend, **Python/Flask** backend, and **PostgreSQL** database. The application supports HRSA Electronic Handbooks–style branding and includes **Site Visit Plan (SVP)** management.

---

## Quick links

| Page | Description |
|------|-------------|
| [Architecture](Architecture) | High-level architecture and tech stack |
| [Getting Started](Getting-Started) | Prerequisites, local setup, and verification |
| [Backend](Backend) | Flask API, services, and repository layer |
| [Frontend](Frontend) | Next.js app, routes, and components |
| [Database](Database) | Schema, initialization, and static data |
| [Site Visit Plans (SVP)](Site-Visit-Plans-(SVP)) | SVP list, initiate, and status overview |
| [API Reference](API-Reference) | REST API endpoints |
| [Deployment](Deployment) | Docker, Azure, and CI/CD |
| [Environment Configuration](Environment-Configuration) | Backend and frontend config |

---

## Quick start

```bash
# 1. Start PostgreSQL (Docker or local)
docker run -d --name postgres-local -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=rei_community_dev -p 5432:5432 postgres:15

# 2. Backend
cd backend && pip install -r requirements.txt && cp .env.example .env
python database/init_db.py && python database/seed_data.py
psql "$DATABASE_URL" -f scripts/init_static_data.sql
python app.py

# 3. Frontend (new terminal)
cd frontend && npm install && npm run dev

# 4. Open http://localhost:3000/login (admin / admin)
```

---

## Tech stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 14 (React 18), client-side routing |
| **Backend** | Python 3.11, Flask 3.0, repository pattern |
| **Database** | PostgreSQL 14+ |
| **DevOps** | Docker, GitHub Actions, Azure Container Registry |

---

## Test users

| Username | Password |
|----------|----------|
| admin | admin |
| testuser | password |

---

© 2026 REI Systems. All rights reserved.
