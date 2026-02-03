# Deployment

## Docker (local)

### Prerequisites

- Docker Desktop
- Ports 3000, 3001, 5432 free

### 1. Start PostgreSQL

```bash
docker run -d --name postgres-local \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=rei_community_dev \
  -p 5432:5432 \
  postgres:15
```

### 2. Initialize database

```bash
cd backend
docker build -t backend:latest .
docker run --rm --network host backend:latest python database/init_db.py
docker run --rm --network host backend:latest python database/seed_data.py
# Then run init_static_data.sql against the DB (e.g. from host with psql)
```

### 3. Run backend

```bash
docker run -d -p 3001:3001 \
  -e DATABASE_URL=postgresql://admin:admin@host.docker.internal:5432/rei_community_dev \
  --name backend-app \
  backend:latest
```

### 4. Run frontend

```bash
cd frontend
docker build -t frontend:latest .
docker run -d -p 3000:3000 --name frontend-app frontend:latest
```

### 5. Access

- **App:** http://localhost:3000/login  
- **Credentials:** admin / admin  

---

## Azure

### Resources (example)

- **Resource group:** e.g. `RG-OpenSourcePOC`
- **PostgreSQL:** Azure Container Instance or managed DB (e.g. `rei-pprs-postgres` / `rei_pprs_dev`)
- **Container Registry:** e.g. `reiopensourcepoc.azurecr.io`

### GitHub Actions

Workflow: `.github/workflows/build-docker.yml`

- **Triggers:** Push or PR to `main`, or `workflow_dispatch`.
- **Secrets:** `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_BACKEND_URL` (for frontend build).
- **Jobs:**
  - Build and push **backend** image to ACR (`backend:latest`, `backend:<sha>`).
  - Build and push **frontend** image with `NEXT_PUBLIC_BACKEND_URL` from `AZURE_BACKEND_URL`.

### Manual push to ACR

```bash
# Backend
cd backend
docker build -t reiopensourcepoc.azurecr.io/hrsa-backend:latest .
docker push reiopensourcepoc.azurecr.io/hrsa-backend:latest

# Frontend (set build-arg if needed)
cd frontend
docker build --build-arg NEXT_PUBLIC_BACKEND_URL=https://your-backend.azurecontainer.io -t reiopensourcepoc.azurecr.io/hrsa-frontend:latest .
docker push reiopensourcepoc.azurecr.io/hrsa-frontend:latest
```

Containers are then deployed to Azure Container Instances (or your chosen host) using these images.
