################################################################################
# Azure Frontend Deployment Script (PowerShell)
################################################################################
#
# This script builds and deploys the frontend to Azure Container Instances
#
# Usage:
#   .\deploy-frontend.ps1
#
################################################################################

# Stop on errors
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend Deployment to Azure" -ForegroundColor Cyan
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

$required = @("ACR_NAME", "ACR_PASSWORD", "RESOURCE_GROUP", "BACKEND_DNS_LABEL")
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
Write-Host "  Image: $ACR_NAME.azurecr.io/frontend:$VERSION" -ForegroundColor Gray

# Use Front Door HTTPS backend URL
$BACKEND_URL = $BACKEND_FRONTDOOR_URL
Write-Host "  Backend URL: $BACKEND_URL" -ForegroundColor Gray
Write-Host ""

$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$FRONTEND_PATH = Join-Path $PROJECT_ROOT "frontend"

try {
    docker build `
        --no-cache `
        --build-arg NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL `
        -t "$ACR_NAME.azurecr.io/frontend:$VERSION" `
        $FRONTEND_PATH
    
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
    docker push "$ACR_NAME.azurecr.io/frontend:$VERSION"
    Write-Host ""
    Write-Host "  ✅ Image pushed successfully" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Image push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

################################################################################
# Step 7: Check for Existing Container
################################################################################

Write-Host "Step 7: Checking for existing container..." -ForegroundColor Yellow

$containerExists = az container show `
    --resource-group $RESOURCE_GROUP `
    --name "$FRONTEND_DNS_LABEL" `
    --query "name" -o tsv 2>$null

if ($containerExists) {
    Write-Host "  ℹ️  Container exists - will update with zero downtime" -ForegroundColor Cyan
} else {
    Write-Host "  ℹ️  No existing container - will create new" -ForegroundColor Cyan
}

Write-Host ""

################################################################################
# Step 8: Create/Update Container Instance
################################################################################

if ($containerExists) {
    Write-Host "Step 8: Updating existing container instance (zero downtime)..." -ForegroundColor Yellow
} else {
    Write-Host "Step 8: Creating new container instance..." -ForegroundColor Yellow
}
Write-Host "  This may take 1-2 minutes..." -ForegroundColor Gray
Write-Host ""

try {
    az container create `
        --resource-group $RESOURCE_GROUP `
        --name "$FRONTEND_DNS_LABEL" `
        --image "$ACR_NAME.azurecr.io/frontend:$VERSION" `
        --registry-login-server "$ACR_NAME.azurecr.io" `
        --registry-username $ACR_USERNAME `
        --registry-password $ACR_PASSWORD `
        --dns-name-label $FRONTEND_DNS_LABEL `
        --ports $FRONTEND_PORT `
        --os-type Linux `
        --cpu $CPU `
        --memory $MEMORY `
        --environment-variables `
            NEXT_PUBLIC_BACKEND_URL=$BACKEND_FRONTDOOR_URL `
        --location $LOCATION `
        --output none
    
    if ($containerExists) {
        Write-Host "  ✅ Container updated successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✅ Container created successfully" -ForegroundColor Green
    }
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
        --name "$FRONTEND_DNS_LABEL" `
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
# Step 10: Display Summary
################################################################################

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Frontend Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$containerInfo = az container show `
    --resource-group $RESOURCE_GROUP `
    --name "$FRONTEND_DNS_LABEL" `
    --query "{FQDN:ipAddress.fqdn, IP:ipAddress.ip, Status:instanceView.state}" -o json | ConvertFrom-Json

Write-Host "Container Details:" -ForegroundColor Cyan
Write-Host "  Name:    $FRONTEND_DNS_LABEL" -ForegroundColor Gray
Write-Host "  Image:   frontend:$VERSION" -ForegroundColor Gray
Write-Host "  Status:  $($containerInfo.Status)" -ForegroundColor Gray
Write-Host "  IP:      $($containerInfo.IP)" -ForegroundColor Gray
Write-Host ""

Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://$($containerInfo.FQDN):$FRONTEND_PORT" -ForegroundColor Gray
Write-Host "  Login:    http://$($containerInfo.FQDN):$FRONTEND_PORT/login" -ForegroundColor Gray
Write-Host ""

Write-Host "Open in browser:" -ForegroundColor Cyan
Write-Host "  Start-Process 'http://$($containerInfo.FQDN):$FRONTEND_PORT/login'" -ForegroundColor Gray
Write-Host ""
