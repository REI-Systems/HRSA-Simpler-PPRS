# Docker Compose Local Development Guide

## Overview

This guide explains how to run the HRSA PPRS application locally using Docker Compose. This approach builds and runs the same Docker images that are deployed to Azure, ensuring consistency between local testing and production.

---

## Prerequisites

- Docker Desktop installed and running
- Git repository cloned
- Azure PostgreSQL database accessible (or local PostgreSQL running)

---

## Quick Start

### 1. Navigate to the directory

```powershell
cd Y:\OpenSource-POC\REI-PPRS-POC\deployment\local
```

### 2. Start the application

```powershell
docker-compose up
```

This will:
- Build the backend Docker image
- Build the frontend Docker image
- Start both containers
- Create a network for them to communicate
- Expose ports 3000 (frontend) and 3001 (backend)

### 3. Access the application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

### 4. Stop the application

Press `Ctrl+C` in the terminal, then run:

```powershell
docker-compose down
```

---

## Common Commands

### Start in detached mode (background)
```powershell
docker-compose up -d
```

### View logs
```powershell
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Rebuild images (after code changes)
```powershell
docker-compose up --build
```

### Stop and remove containers
```powershell
docker-compose down
```

### Stop, remove containers, and remove images
```powershell
docker-compose down --rmi all
```

---

## Configuration

### Environment Variables

The `docker-compose.yml` file uses environment variables with defaults. You can override them by creating a `.env` file in the `deployment/local` directory:

**Example `.env` file:**

```env
# Database Configuration
AZURE_DB_HOST=rei-pprs-db.bpfvc3g9bagkb3gj.eastus.azurecontainer.io
AZURE_DB_USER=admin
AZURE_DB_PASSWORD=Admin123!@#
AZURE_DB_NAME=rei_pprs_dev
AZURE_DB_PORT=5432
```

### Using Local PostgreSQL

If you want to use a local PostgreSQL database instead of Azure:

1. Start PostgreSQL locally (or use the `setup-postgres.ps1` script)
2. Update the `.env` file:

```env
AZURE_DB_HOST=host.docker.internal
AZURE_DB_USER=admin
AZURE_DB_PASSWORD=admin
AZURE_DB_NAME=rei_pprs_dev
AZURE_DB_PORT=5432
```

**Note:** `host.docker.internal` is a special DNS name that resolves to your host machine from inside Docker containers.

---

## Troubleshooting

### Port Already in Use

**Error:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution:** Stop any processes using ports 3000 or 3001:

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

Or change the ports in `docker-compose.yml`:

```yaml
ports:
  - "3002:3000"  # Map host port 3002 to container port 3000
```

### Cannot Connect to Database

**Check database connectivity:**

```powershell
# From your host machine
Test-NetConnection -ComputerName rei-pprs-db.bpfvc3g9bagkb3gj.eastus.azurecontainer.io -Port 5432
```

**Check backend logs:**

```powershell
docker-compose logs backend
```

### Frontend Can't Connect to Backend

**Verify backend is running:**

```powershell
curl http://localhost:3001/health
```

**Check CORS configuration:**

The backend should show in logs:
```
CORS configured with allowed origins: ['http://localhost:3000', ...]
```

### Images Not Updating After Code Changes

**Rebuild images:**

```powershell
docker-compose up --build
```

Or force rebuild:

```powershell
docker-compose build --no-cache
docker-compose up
```

---

## Comparison: Docker Compose vs Direct Execution

| Aspect | Docker Compose | Direct (Python + npm) |
|--------|---------------|----------------------|
| **Setup Time** | Slower (builds images) | Faster (no build) |
| **Consistency** | Same as Azure deployment | May differ from production |
| **Dependencies** | Isolated in containers | Requires local Python/Node |
| **Networking** | Requires configuration | Simple localhost |
| **Best For** | Testing deployment | Quick development |

---

## When to Use Docker Compose

✅ **Use Docker Compose when:**
- Testing the actual Docker images before Azure deployment
- Verifying the production build works correctly
- Reproducing production issues locally
- Onboarding new developers (consistent environment)

❌ **Don't use Docker Compose when:**
- Doing rapid development with frequent code changes
- Debugging with breakpoints (harder in containers)
- You just want to test a quick change

For rapid development, use the direct execution method (see `setup-dev-environment.ps1`).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                            │
│                  (rei-pprs-network)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │  Backend Container   │    │  Frontend Container  │      │
│  │                      │    │                      │      │
│  │  Python Flask        │◄───│  React + Next.js     │      │
│  │  Port: 3001          │    │  Port: 3000          │      │
│  │                      │    │                      │      │
│  └──────────────────────┘    └──────────────────────┘      │
│           │                                                  │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────┐                                   │
│  │  Azure PostgreSQL    │                                   │
│  │  (External)          │                                   │
│  └──────────────────────┘                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                          │
         │                          │
         ▼                          ▼
    localhost:3001            localhost:3000
    (Your Browser)            (Your Browser)
```

---

## Next Steps

After verifying the application works locally with Docker Compose:

1. ✅ Test all features (login, navigation, forms)
2. ✅ Check browser console for errors
3. ✅ Verify database connectivity
4. ✅ Test with different data scenarios
5. ✅ Deploy to Azure using `deployment/azure/deploy-all.ps1`

---

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify Docker is running: `docker --version`
3. Check port availability: `netstat -ano | findstr :3000`
4. Review the troubleshooting section above
5. Consult the main README.md for application-specific help

---

**Happy Testing! 🚀**
