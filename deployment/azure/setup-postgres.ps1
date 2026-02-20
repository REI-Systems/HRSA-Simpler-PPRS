################################################################################
# Azure PostgreSQL Container Instance Setup Script (PowerShell)
################################################################################
#
# This script creates a PostgreSQL 15 database using Azure Container Instances
# for the HRSA PPRS application.
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Appropriate permissions on the Azure subscription
#
# Usage:
#   .\setup-postgres.ps1
#
################################################################################

# Stop on errors
$ErrorActionPreference = "Stop"

# Configuration
$RESOURCE_GROUP = "RG-OpenSourcePOC"
$CONTAINER_NAME = "rei-pprs-db"
$DNS_LABEL = "rei-pprs-db"
$LOCATION = "eastus"
$POSTGRES_IMAGE = "postgres:17"
$POSTGRES_USER = "admin"
$POSTGRES_PASSWORD = "<YOUR_PASSWORD_HERE>"  # Replace with your actual password
$POSTGRES_DB = "rei_pprs_dev"
$CPU = "1"
$MEMORY = "2"
$PORT = "5432"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Container Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Resource Group: $RESOURCE_GROUP"
Write-Host "  Container Name: $CONTAINER_NAME"
Write-Host "  Location: $LOCATION"
Write-Host "  Database: $POSTGRES_DB"
Write-Host "  Username: $POSTGRES_USER"
Write-Host ""

# Check if Azure CLI is installed
Write-Host "Checking Azure CLI installation..." -ForegroundColor Yellow
try {
    $null = az --version
    Write-Host "✅ Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Azure CLI is not installed" -ForegroundColor Red
    Write-Host "   Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Azure
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
try {
    $null = az account show 2>$null
    Write-Host "✅ Azure CLI authenticated" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Not logged in to Azure" -ForegroundColor Red
    Write-Host "   Run: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if password has been set
if ($POSTGRES_PASSWORD -eq "<YOUR_PASSWORD_HERE>") {
    Write-Host "❌ Error: Please set POSTGRES_PASSWORD in the script" -ForegroundColor Red
    Write-Host "   Edit the script and replace <YOUR_PASSWORD_HERE> with your actual password" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Password configured" -ForegroundColor Green
Write-Host ""

# Create PostgreSQL Container Instance
Write-Host "Creating PostgreSQL Container Instance..." -ForegroundColor Green
Write-Host "This may take 1-2 minutes..." -ForegroundColor Yellow
Write-Host ""

az container create `
  --resource-group $RESOURCE_GROUP `
  --name $CONTAINER_NAME `
  --image $POSTGRES_IMAGE `
  --dns-name-label $DNS_LABEL `
  --ports $PORT `
  --os-type Linux `
  --cpu $CPU `
  --memory $MEMORY `
  --environment-variables `
    POSTGRES_USER=$POSTGRES_USER `
    POSTGRES_PASSWORD=$POSTGRES_PASSWORD `
    POSTGRES_DB=$POSTGRES_DB `
  --location $LOCATION

Write-Host ""
Write-Host "Waiting for container to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Get connection details
Write-Host ""
Write-Host "Retrieving connection details..." -ForegroundColor Yellow
$FQDN = az container show `
  --resource-group $RESOURCE_GROUP `
  --name $CONTAINER_NAME `
  --query ipAddress.fqdn `
  --output tsv

$IP = az container show `
  --resource-group $RESOURCE_GROUP `
  --name $CONTAINER_NAME `
  --query ipAddress.ip `
  --output tsv

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "✅ PostgreSQL Container Created!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Connection Details:" -ForegroundColor Cyan
Write-Host "-------------------"
Write-Host "  Host: $FQDN"
Write-Host "  IP Address: $IP"
Write-Host "  Port: $PORT"
Write-Host "  Database: $POSTGRES_DB"
Write-Host "  Username: $POSTGRES_USER"
Write-Host "  Password: $POSTGRES_PASSWORD"
Write-Host ""
Write-Host "Connection String:" -ForegroundColor Cyan
Write-Host "-------------------"
Write-Host "  postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${FQDN}:${PORT}/${POSTGRES_DB}"
Write-Host ""
Write-Host "Test Connection:" -ForegroundColor Cyan
Write-Host "-------------------"
Write-Host "  psql -h $FQDN -p $PORT -U $POSTGRES_USER -d $POSTGRES_DB"
Write-Host ""
Write-Host "Backend .env Configuration:" -ForegroundColor Cyan
Write-Host "-------------------"
Write-Host "  AZURE_DB_HOST=$FQDN"
Write-Host "  AZURE_DB_USER=$POSTGRES_USER"
Write-Host "  AZURE_DB_PASSWORD=$POSTGRES_PASSWORD"
Write-Host "  AZURE_DB_NAME=$POSTGRES_DB"
Write-Host "  AZURE_DB_PORT=$PORT"
Write-Host ""

# Initialize database tables and seed data
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Initializing Database" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Database initialization requires the backend container to be deployed first." -ForegroundColor Yellow
Write-Host "      If backend container doesn't exist yet, you can run this later:" -ForegroundColor Yellow
Write-Host "      az container exec --resource-group $RESOURCE_GROUP --name rei-pprs-backend --exec-command `"python database/init_db.py`"" -ForegroundColor Gray
Write-Host "      az container exec --resource-group $RESOURCE_GROUP --name rei-pprs-backend --exec-command `"python database/seed_data.py`"" -ForegroundColor Gray
Write-Host ""

# Check if backend container exists
Write-Host "Checking for backend container..." -ForegroundColor Yellow
$backendExists = $false
try {
    $null = az container show --resource-group $RESOURCE_GROUP --name rei-pprs-backend --query name -o tsv 2>$null
    $backendExists = $true
    Write-Host "✅ Backend container found" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend container not found - skipping database initialization" -ForegroundColor Yellow
    Write-Host "   Deploy backend first, then run the commands above to initialize database" -ForegroundColor Yellow
}

if ($backendExists) {
    Write-Host ""
    Write-Host "Creating database tables..." -ForegroundColor Yellow
    try {
        az container exec `
            --resource-group $RESOURCE_GROUP `
            --name rei-pprs-backend `
            --exec-command "python database/init_db.py"
        Write-Host "✅ Database tables created successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create database tables" -ForegroundColor Red
        Write-Host "   You may need to run this manually after backend deployment" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Seeding database with initial data..." -ForegroundColor Yellow
    try {
        az container exec `
            --resource-group $RESOURCE_GROUP `
            --name rei-pprs-backend `
            --exec-command "python database/seed_data.py"
        Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Default Users Created:" -ForegroundColor Cyan
        Write-Host "  Username: admin     Password: admin" -ForegroundColor Green
        Write-Host "  Username: testuser  Password: password" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to seed database" -ForegroundColor Red
        Write-Host "   You may need to run this manually after backend deployment" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "✅ PostgreSQL Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
