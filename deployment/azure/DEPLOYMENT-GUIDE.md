# 🚀 Azure Deployment Guide

**Complete guide for deploying HRSA PPRS to Azure Container Instances.**

> 📖 This is the main documentation for Azure deployments. Everything you need is here!

---

## 📁 Contents

### Database Setup
| Script | Description |
|--------|-------------|
| `setup-postgres.sh` | Bash script to create PostgreSQL Container Instance |
| `setup-postgres.ps1` | PowerShell script to create PostgreSQL Container Instance |

### Application Deployment
| Script | Description |
|--------|-------------|
| `deploy-backend.ps1` | Deploy backend to Azure Container Instances |
| `deploy-frontend.ps1` | Deploy frontend to Azure Container Instances |
| `deploy-all.ps1` | Deploy both backend and frontend |
| `.env.example` | Configuration template |
| `.env` | Your actual configuration (not in git) |

---

## 📋 Prerequisites

- ✅ Azure CLI installed
- ✅ Docker Desktop running
- ✅ Logged into Azure (`az login`)
- ✅ `.env` file configured
- ✅ Resource Group `RG-OpenSourcePOC` exists

---

## 🎯 Common Deployment Scenarios

### Scenario 1: First Time Deployment

```powershell
# 1. Setup configuration (one-time)
cd deployment\azure
cp .env.example .env
notepad .env  # Fill in your values

# 2. Deploy everything
.\deploy-all.ps1
```

---

### Scenario 2: Backend Code Changes

```powershell
# After making backend changes
cd deployment\azure
.\deploy-backend.ps1
```

**What it does:**
1. ✅ Builds new Docker image
2. ✅ Pushes to Azure Container Registry
3. ✅ Deletes old container
4. ✅ Creates new container with updated code
5. ✅ Runs health check

**Time:** ~3-5 minutes

---

### Scenario 3: Frontend Code Changes

```powershell
# After making frontend changes
cd deployment\azure
.\deploy-frontend.ps1
```

**What it does:**
1. ✅ Builds new Docker image with backend URL
2. ✅ Pushes to Azure Container Registry
3. ✅ Deletes old container
4. ✅ Creates new container with updated code

**Time:** ~3-5 minutes

---

### Scenario 4: Both Backend and Frontend Changes

```powershell
# Deploy both
cd deployment\azure
.\deploy-all.ps1
```

**Time:** ~6-10 minutes

---

## 🔧 Configuration

### `.env` File Structure

```bash
# Azure Container Registry
ACR_NAME=reiopensourcepoc
ACR_USERNAME=reiopensourcepoc
ACR_PASSWORD=<your-password>

# Azure Resource Group
RESOURCE_GROUP=RG-OpenSourcePOC
LOCATION=eastus

# Database Configuration
DB_HOST=<your-db-host>
DB_USER=admin
DB_PASSWORD=<your-db-password>
DB_NAME=rei_pprs_dev
DB_PORT=5432

# Container Configuration
BACKEND_DNS_LABEL=rei-pprs-backend
FRONTEND_DNS_LABEL=rei-pprs-frontend
BACKEND_PORT=3001
FRONTEND_PORT=3000
CPU=1
MEMORY=1.5

# Version
VERSION=v1.2
```

---

## 📊 What Each Script Does

### `deploy-backend.ps1`

**Steps:**
1. Load configuration from `.env`
2. Validate all required values
3. Check prerequisites (Azure CLI, Docker)
4. Login to Azure Container Registry
5. Build backend Docker image
6. Push image to ACR
7. Delete old container (if exists)
8. Create new container with environment variables
9. Wait for container to be ready
10. Run health check
11. Display access URLs

**Environment Variables Set:**
- `AZURE_DB_HOST`
- `AZURE_DB_USER`
- `AZURE_DB_PASSWORD`
- `AZURE_DB_NAME`
- `AZURE_DB_PORT`
- `PORT`

---

### `deploy-frontend.ps1`

**Steps:**
1. Load configuration from `.env`
2. Validate all required values
3. Check prerequisites (Azure CLI, Docker)
4. Login to Azure Container Registry
5. Build frontend Docker image with `NEXT_PUBLIC_BACKEND_URL`
6. Push image to ACR
7. Delete old container (if exists)
8. Create new container
9. Wait for container to be ready
10. Display access URLs

**Build Arguments:**
- `NEXT_PUBLIC_BACKEND_URL` (baked into image)

---

### `deploy-all.ps1`

**Steps:**
1. Display deployment plan
2. Ask for confirmation
3. Run `deploy-backend.ps1`
4. Wait for user confirmation
5. Run `deploy-frontend.ps1`
6. Display final summary with all URLs

---

## 🧪 Testing Deployment

### Test Backend

```powershell
# Health check
Invoke-RestMethod -Uri http://rei-pprs-backend.eastus.azurecontainer.io:3001/health

# Welcome API
Invoke-RestMethod -Uri http://rei-pprs-backend.eastus.azurecontainer.io:3001/api/welcome

# Login API
Invoke-RestMethod -Uri http://rei-pprs-backend.eastus.azurecontainer.io:3001/api/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin"}'
```

### Test Frontend

```powershell
# Open in browser
Start-Process 'http://rei-pprs-frontend.eastus.azurecontainer.io:3000/login'
```

**Login Credentials:**
- Username: `admin`
- Password: `admin`

---

## 🔍 Troubleshooting

### Issue: `.env file not found`

**Solution:**
```powershell
cd deployment\azure
cp .env.example .env
notepad .env  # Fill in your values
```

---

### Issue: `ACR login failed`

**Solution:**
```powershell
# Check if logged into Azure
az account show

# If not, login
az login

# Verify ACR credentials in .env
```

---

### Issue: `Docker build failed`

**Solution:**
```powershell
# Check if Docker Desktop is running
docker --version

# Start Docker Desktop if needed
```

---

### Issue: `Container creation failed`

**Solution:**
```powershell
# Check resource group exists
az group show --name RG-OpenSourcePOC

# Check if container name is unique
az container list --resource-group RG-OpenSourcePOC --output table

# Delete old container if needed
az container delete --resource-group RG-OpenSourcePOC --name rei-pprs-backend --yes
```

---

### Issue: `Health check failed`

**Possible causes:**
- Container is still starting (wait 30 seconds and try again)
- Database connection issue (check DB_HOST, DB_PASSWORD in .env)
- Backend code error (check container logs)

**Check logs:**
```powershell
az container logs --resource-group RG-OpenSourcePOC --name rei-pprs-backend
```

---

## 📈 Version Management

### Auto-Increment Version

Edit `.env` and update `VERSION`:
```bash
VERSION=v1.3  # Increment from v1.2
```

### Use Git Tags

```powershell
# Tag the release
git tag v1.3
git push --tags

# Update .env
VERSION=v1.3

# Deploy
.\deploy-all.ps1
```

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` file** - It's already in `.gitignore`
2. ✅ **Use strong passwords** - Change default passwords
3. ✅ **Rotate credentials** - Update ACR and DB passwords regularly
4. ✅ **Limit access** - Use Azure RBAC for team access
5. ✅ **Monitor logs** - Check container logs for security issues

---

## 📞 Getting Help

### View Container Status

```powershell
az container list --resource-group RG-OpenSourcePOC --output table
```

### View Container Logs

```powershell
# Backend logs
az container logs --resource-group RG-OpenSourcePOC --name rei-pprs-backend

# Frontend logs
az container logs --resource-group RG-OpenSourcePOC --name rei-pprs-frontend
```

### View Container Details

```powershell
az container show --resource-group RG-OpenSourcePOC --name rei-pprs-backend
```

### Delete Container

```powershell
az container delete --resource-group RG-OpenSourcePOC --name rei-pprs-backend --yes
```

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Code changes committed to git
- [ ] Local testing completed
- [ ] `.env` file configured
- [ ] Docker Desktop running
- [ ] Logged into Azure
- [ ] Database is running

After deploying:
- [ ] Health check passed
- [ ] Frontend loads in browser
- [ ] Can login successfully
- [ ] New features working
- [ ] No errors in logs

---

## 🎯 Quick Commands Reference

```powershell
# Deploy everything
.\deploy-all.ps1

# Deploy backend only
.\deploy-backend.ps1

# Deploy frontend only
.\deploy-frontend.ps1

# Check container status
az container list --resource-group RG-OpenSourcePOC --output table

# View logs
az container logs --resource-group RG-OpenSourcePOC --name rei-pprs-backend

# Test backend
Invoke-RestMethod -Uri http://rei-pprs-backend.eastus.azurecontainer.io:3001/health

# Open frontend
Start-Process 'http://rei-pprs-frontend.eastus.azurecontainer.io:3000/login'
```

---

## 🗄️ PostgreSQL Database Setup

### Database Options

**Option 1: Azure Managed PostgreSQL (Recommended)** ⭐
- ✅ Data persists forever (no data loss)
- ✅ Automatic backups (7-35 days retention)
- ✅ 99.9% SLA
- ✅ Professional database service
- 💰 Cost: ~$12-15/month (Burstable tier)

**Option 2: PostgreSQL Container Instance (POC/Dev Only)**
- ⚠️ Data lost on container restart
- ⚠️ No automatic backups
- ⚠️ Manual reinitialization required
- 💰 Cost: ~$15-20/month

---

### Option 1: Azure Managed PostgreSQL Setup (Recommended)

**Create Database:**
```powershell
az postgres flexible-server create `
  --resource-group RG-OpenSourcePOC `
  --name <your-server-name> `
  --location eastus2 `
  --admin-user pprsadmin `
  --admin-password "<YourSecurePassword>" `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --storage-size 32 `
  --version 17 `
  --yes
```

**Configure Firewall:**
```powershell
# Allow Azure services
az postgres flexible-server firewall-rule create `
  --resource-group RG-OpenSourcePOC `
  --name <your-server-name> `
  --rule-name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

**Update .env file:**
```bash
DB_HOST=<your-server-name>.postgres.database.azure.com
DB_USER=pprsadmin
DB_PASSWORD=<YourSecurePassword>
DB_NAME=postgres
DB_PORT=5432
```

**Initialize Database:**
```powershell
# Set environment variables
$env:AZURE_DB_HOST="<your-server-name>.postgres.database.azure.com"
$env:AZURE_DB_USER="pprsadmin"
$env:AZURE_DB_PASSWORD="<YourSecurePassword>"
$env:AZURE_DB_NAME="postgres"
$env:AZURE_DB_PORT="5432"

# Initialize
cd backend
python database/init_db.py
python database/seed_data.py
```

---

### Option 2: PostgreSQL Container Instance Setup

### Prerequisites

- Azure CLI installed and authenticated (`az login`)
- Appropriate permissions on Azure subscription
- Resource Group `RG-OpenSourcePOC` must exist

### Before Running

**⚠️ Important:** You must set the database password before running the script.

1. Open the script file (`setup-postgres.sh` or `setup-postgres.ps1`)
2. Find the line: `POSTGRES_PASSWORD="<YOUR_PASSWORD_HERE>"`
3. Replace `<YOUR_PASSWORD_HERE>` with your actual password
4. Save the file

**Example:**
```bash
# Before:
POSTGRES_PASSWORD="<YOUR_PASSWORD_HERE>"

# After:
POSTGRES_PASSWORD="MySecurePassword123!"
```

### Usage

**Linux/macOS (Bash):**
```bash
cd deployment/azure
chmod +x setup-postgres.sh
./setup-postgres.sh
```

**Windows (PowerShell):**
```powershell
cd deployment\azure
.\setup-postgres.ps1
```

### What It Does

1. ✅ Creates Azure Container Instance named `rei-pprs-db`
2. ✅ Deploys PostgreSQL 17 database
3. ✅ Configures database with:
   - Database: `rei_pprs_dev`
   - Username: `admin`
   - Port: `5432`
4. ✅ Assigns public DNS name
5. ✅ Displays connection details

### After Running

1. **Update Backend Configuration:**
   
   Copy the connection details to `backend/.env`:
   ```bash
   AZURE_DB_HOST=<FQDN from script output>
   AZURE_DB_USER=<username from script output>
   AZURE_DB_PASSWORD=<password from script output>
   AZURE_DB_NAME=rei_pprs_dev
   AZURE_DB_PORT=5432
   ```

2. **Initialize Database:**
   ```bash
   cd backend
   python database/init_db.py
   python database/seed_data.py
   ```

### Database Management Commands

**View Container Status:**
```bash
az container show \
  --resource-group RG-OpenSourcePOC \
  --name rei-pprs-db \
  --query "{Name:name, Status:instanceView.state, FQDN:ipAddress.fqdn}" \
  --output table
```

**View Logs:**
```bash
az container logs \
  --resource-group RG-OpenSourcePOC \
  --name rei-pprs-db
```

**Restart Container:**
```bash
az container restart \
  --resource-group RG-OpenSourcePOC \
  --name rei-pprs-db
```

**Delete Container:**
```bash
az container delete \
  --resource-group RG-OpenSourcePOC \
  --name rei-pprs-db \
  --yes
```

### Database Configuration

| Parameter | Value |
|-----------|-------|
| **Resource Group** | RG-OpenSourcePOC |
| **Container Name** | rei-pprs-db |
| **Image** | postgres:17 |
| **Location** | East US |
| **CPU** | 1 core |
| **Memory** | 2 GB |
| **Port** | 5432 |
| **Database** | rei_pprs_dev |
| **Username** | admin |
| **Password** | (configured in script) |

---

## ⚠️ Important Notes

### Security Considerations

- ⚠️ Database is publicly accessible (not recommended for production)
- ⚠️ Password is stored in plain text in script (use Azure Key Vault for production)
- ⚠️ No SSL/TLS encryption enabled by default

### Production Recommendations

For production deployments, consider:

1. **Use Azure Database for PostgreSQL** (managed service)
2. **Enable Private Endpoints** (VNet integration)
3. **Store secrets in Azure Key Vault**
4. **Enable SSL/TLS** connections
5. **Set up automated backups**
6. **Configure firewall rules** to restrict access

### Data Persistence

- ⚠️ Container Instances do not have persistent storage by default
- ⚠️ Data will be lost if container is deleted
- ⚠️ For production, use Azure Database for PostgreSQL or mount Azure Files

---

## 📚 Additional Resources

- [Azure Container Instances Documentation](https://docs.microsoft.com/en-us/azure/container-instances/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)

---

**Happy Deploying! 🚀**
