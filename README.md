# HRSA Electronic Handbooks - Community Development Platform

A full-stack web application with authentication, built with Next.js frontend, Python/Flask backend, and PostgreSQL database.

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

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker Desktop installed and running
- Ports 3000, 3001, 5432 available

### 1. Start PostgreSQL
```bash
docker run -d --name postgres-local \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=rei_community_dev \
  -p 5432:5432 \
  postgres:15
```

### 2. Initialize Database
```bash
cd backend
docker build -t backend:latest .
docker run --rm --network host backend:latest python database/init_db.py
docker run --rm --network host backend:latest python database/seed_data.py
```

### 3. Start Backend
```bash
docker run -d -p 3001:3001 \
  -e DATABASE_URL=postgresql://admin:admin@host.docker.internal:5432/rei_community_dev \
  --name backend-app \
  backend:latest
```

### 4. Start Frontend
```bash
cd frontend
docker build -t frontend:latest .
docker run -d -p 3000:3000 --name frontend-app frontend:latest
```

### 5. Access Application
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

## 🔧 Configuration

**Frontend:** `frontend/public/config.json`
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

**Backend:** Environment variable
```
DATABASE_URL=postgresql://admin:admin@localhost:5432/rei_community_dev
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

## 🚢 Deployment

See `.github/workflows/build-docker.yml` for automated deployment to Azure.

## 📄 License

© 2026 REI Systems. All rights reserved.
