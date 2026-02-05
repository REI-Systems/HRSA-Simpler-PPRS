################################################################################
# Azure Full Deployment Script (PowerShell)
################################################################################
#
# This script deploys backend and frontend to Azure Container Instances
#
# Usage:
#   .\deploy-all.ps1
#
################################################################################

# Stop on errors
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Full Deployment to Azure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

################################################################################
# Display Deployment Plan
################################################################################

Write-Host "Deployment Plan:" -ForegroundColor Yellow
Write-Host "  1. Backend  - Build and deploy" -ForegroundColor Gray
Write-Host "  2. Frontend - Build and deploy" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue with deployment? (y/n)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

################################################################################
# Deploy Backend
################################################################################

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Deploying Backend..." -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

try {
    & "$PSScriptRoot\deploy-backend.ps1"
} catch {
    Write-Host ""
    Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
    Write-Host "Stopping deployment process" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue with frontend deployment..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

################################################################################
# Deploy Frontend
################################################################################

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Deploying Frontend..." -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

try {
    & "$PSScriptRoot\deploy-frontend.ps1"
} catch {
    Write-Host ""
    Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
    Write-Host "Note: Backend was deployed successfully" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

################################################################################
# Final Summary
################################################################################

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Full Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Load configuration for summary
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

Write-Host "All Services Deployed:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Backend:" -ForegroundColor Yellow
Write-Host "  URL:    http://$BACKEND_DNS_LABEL.$LOCATION.azurecontainer.io:$BACKEND_PORT" -ForegroundColor Gray
Write-Host "  Health: http://$BACKEND_DNS_LABEL.$LOCATION.azurecontainer.io:$BACKEND_PORT/health" -ForegroundColor Gray
Write-Host ""

Write-Host "Frontend:" -ForegroundColor Yellow
Write-Host "  URL:   http://$FRONTEND_DNS_LABEL.$LOCATION.azurecontainer.io:$FRONTEND_PORT" -ForegroundColor Gray
Write-Host "  Login: http://$FRONTEND_DNS_LABEL.$LOCATION.azurecontainer.io:$FRONTEND_PORT/login" -ForegroundColor Gray
Write-Host ""

Write-Host "Database:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST" -ForegroundColor Gray
Write-Host "  Port: $DB_PORT" -ForegroundColor Gray
Write-Host ""

Write-Host "Test the deployment:" -ForegroundColor Cyan
Write-Host "  # Backend health check" -ForegroundColor Gray
Write-Host "  Invoke-RestMethod -Uri http://$BACKEND_DNS_LABEL.$LOCATION.azurecontainer.io:$BACKEND_PORT/health" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Open frontend in browser" -ForegroundColor Gray
Write-Host "  Start-Process 'http://$FRONTEND_DNS_LABEL.$LOCATION.azurecontainer.io:$FRONTEND_PORT/login'" -ForegroundColor Gray
Write-Host ""

Write-Host "Login Credentials:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor Gray
Write-Host "  Password: admin" -ForegroundColor Gray
Write-Host ""
