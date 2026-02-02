# REI - PPRS - POC - Community Development Platform

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

## 🚀 Quick Start

### Option 1: Local Development (Recommended for Development)

#### Prerequisites
- Python 3.13+
- Node.js 18+
- Azure PostgreSQL Container Instance (already set up)

#### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Azure PostgreSQL credentials

# Run backend
python app.py
```

Backend will be available at `http://localhost:3001`

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

#### Access Application
- **Login Page:** http://localhost:3000/login
- **Credentials:** username: `admin`, password: `admin`

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

### Automated Deployment

Push to GitHub `main` branch triggers automatic deployment via GitHub Actions.

## 📄 License

© 2026 REI Systems. All rights reserved.
