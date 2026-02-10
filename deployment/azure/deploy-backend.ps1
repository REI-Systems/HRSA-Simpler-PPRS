################################################################################
# Azure Backend Deployment Script (PowerShell)
################################################################################
#
# This script builds and deploys the backend to Azure Container Instances
#
# Usage:
#   .\deploy-backend.ps1
#
################################################################################

# Stop on errors
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend Deployment to Azure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

################################################################################
# Step 1: Load Configuration
################################################################################

Write-Host "Step 1: Loading configuration..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create .env from the template:" -ForegroundColor Yellow
    Write-Host "  1. Copy .env.example to .env" -ForegroundColor Yellow
    Write-Host "  2. Fill in your actual values" -ForegroundColor Yellow
    Write-Host "  3. Run this script again" -ForegroundColor Yellow
    exit 1
}

# Load .env file
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

Write-Host "  ✅ Configuration loaded" -ForegroundColor Green
Write-Host ""

################################################################################
# Step 2: Validate Configuration
################################################################################

Write-Host "Step 2: Validating configuration..." -ForegroundColor Yellow

$required = @("ACR_NAME", "ACR_PASSWORD", "RESOURCE_GROUP", "DB_HOST", "DB_PASSWORD")
$missing = @()

foreach ($var in $required) {
    $value = Get-Variable -Name $var -ValueOnly -ErrorAction SilentlyContinue
    if ([string]::IsNullOrWhiteSpace($value) -or $value -like "<YOUR_*>") {
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-Host "❌ Error: Missing required configuration:" -ForegroundColor Red
    foreach ($var in $missing) {
        Write-Host "  - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please update your .env file with actual values" -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✅ Configuration validated" -ForegroundColor Green
Write-Host ""

################################################################################
# Step 3: Check Prerequisites
################################################################################

Write-Host "Step 3: Checking prerequisites..." -ForegroundColor Yellow

# Check Azure CLI
try {
    $null = az --version 2>$null
    Write-Host "  ✅ Azure CLI installed" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Azure CLI not found" -ForegroundColor Red
    Write-Host "     Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check Docker
try {
    $null = docker --version 2>$null
    Write-Host "  ✅ Docker installed" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker not found" -ForegroundColor Red
    Write-Host "     Install Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Check Azure login
try {
    $null = az account show 2>$null
    Write-Host "  ✅ Logged into Azure" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Not logged into Azure" -ForegroundColor Red
    Write-Host "     Run: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

################################################################################
# Step 4: Login to Azure Container Registry
################################################################################

Write-Host "Step 4: Logging into Azure Container Registry..." -ForegroundColor Yellow

try {
    az acr login --name $ACR_NAME
    Write-Host "  ✅ ACR login successful" -ForegroundColor Green
} catch {
    Write-Host "  ❌ ACR login failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

################################################################################
# Step 5: Build Docker Image
################################################################################

Write-Host "Step 5: Building Docker image..." -ForegroundColor Yellow
Write-Host "  Image: $ACR_NAME.azurecr.io/backend:$VERSION" -ForegroundColor Gray
Write-Host ""

$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BACKEND_PATH = Join-Path $PROJECT_ROOT "backend"

try {
    docker build -t "$ACR_NAME.azurecr.io/backend:$VERSION" $BACKEND_PATH
    Write-Host ""
    Write-Host "  ✅ Docker image built successfully" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

################################################################################
# Step 6: Push Docker Image to ACR
################################################################################

Write-Host "Step 6: Pushing image to Azure Container Registry..." -ForegroundColor Yellow

try {
    docker push "$ACR_NAME.azurecr.io/backend:$VERSION"
    Write-Host ""
    Write-Host "  ✅ Image pushed successfully" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Image push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

################################################################################
# Step 7: Delete Old Container (if exists)
################################################################################

Write-Host "Step 7: Checking for existing container..." -ForegroundColor Yellow

$containerExists = az container show `
    --resource-group $RESOURCE_GROUP `
    --name "$BACKEND_DNS_LABEL" `
    --query "name" -o tsv 2>$null

if ($containerExists) {
    Write-Host "  Container exists, deleting..." -ForegroundColor Gray
    az container delete `
        --resource-group $RESOURCE_GROUP `
        --name "$BACKEND_DNS_LABEL" `
        --yes
    Write-Host "  ✅ Old container deleted" -ForegroundColor Green
} else {
    Write-Host "  ✅ No existing container" -ForegroundColor Green
}

Write-Host ""

################################################################################
# Step 8: Create New Container Instance
################################################################################

Write-Host "Step 8: Creating new container instance..." -ForegroundColor Yellow
Write-Host "  This may take 1-2 minutes..." -ForegroundColor Gray
Write-Host ""

try {
    az container create `
        --resource-group $RESOURCE_GROUP `
        --name "$BACKEND_DNS_LABEL" `
        --image "$ACR_NAME.azurecr.io/backend:$VERSION" `
        --registry-login-server "$ACR_NAME.azurecr.io" `
        --registry-username $ACR_USERNAME `
        --registry-password $ACR_PASSWORD `
        --dns-name-label $BACKEND_DNS_LABEL `
        --ports $BACKEND_PORT `
        --os-type Linux `
        --cpu $CPU `
        --memory $MEMORY `
        --environment-variables `
            AZURE_DB_HOST=$DB_HOST `
            AZURE_DB_USER=$DB_USER `
            AZURE_DB_PASSWORD=$DB_PASSWORD `
            AZURE_DB_NAME=$DB_NAME `
            AZURE_DB_PORT=$DB_PORT `
            PORT=$BACKEND_PORT `
        --location $LOCATION `
        --output none
    
    Write-Host "  ✅ Container created successfully" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Container creation failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

################################################################################
# Step 9: Wait for Container to be Ready
################################################################################

Write-Host "Step 9: Waiting for container to be ready..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    $attempt++
    Start-Sleep -Seconds 2
    
    $state = az container show `
        --resource-group $RESOURCE_GROUP `
        --name "$BACKEND_DNS_LABEL" `
        --query "instanceView.state" -o tsv 2>$null
    
    if ($state -eq "Running") {
        $ready = $true
        Write-Host "  ✅ Container is running" -ForegroundColor Green
    } else {
        Write-Host "  ⏳ Waiting... ($attempt/$maxAttempts)" -ForegroundColor Gray
    }
}

if (-not $ready) {
    Write-Host "  ⚠️  Container did not start in time" -ForegroundColor Yellow
}

Write-Host ""

################################################################################
# Step 10: Health Check
################################################################################

Write-Host "Step 10: Running health check..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

try {
    $healthUrl = "http://$BACKEND_DNS_LABEL.$LOCATION.azurecontainer.io:$BACKEND_PORT/health"
    $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 10
    
    if ($response.status -eq "healthy") {
        Write-Host "  ✅ Health check passed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Health check returned unexpected status" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Health check failed (container may still be starting)" -ForegroundColor Yellow
}

Write-Host ""

################################################################################
# Step 11: Display Summary
################################################################################

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Backend Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$containerInfo = az container show `
    --resource-group $RESOURCE_GROUP `
    --name "$BACKEND_DNS_LABEL" `
    --query "{FQDN:ipAddress.fqdn, IP:ipAddress.ip, Status:instanceView.state}" -o json | ConvertFrom-Json

Write-Host "Container Details:" -ForegroundColor Cyan
Write-Host "  Name:    $BACKEND_DNS_LABEL" -ForegroundColor Gray
Write-Host "  Image:   backend:$VERSION" -ForegroundColor Gray
Write-Host "  Status:  $($containerInfo.Status)" -ForegroundColor Gray
Write-Host "  IP:      $($containerInfo.IP)" -ForegroundColor Gray
Write-Host ""

Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Backend:  http://$($containerInfo.FQDN):$BACKEND_PORT" -ForegroundColor Gray
Write-Host "  Health:   http://$($containerInfo.FQDN):$BACKEND_PORT/health" -ForegroundColor Gray
Write-Host ""

Write-Host "Test the deployment:" -ForegroundColor Cyan
Write-Host "  Invoke-RestMethod -Uri http://$($containerInfo.FQDN):$BACKEND_PORT/health" -ForegroundColor Gray
Write-Host ""
