################################################################################
# Local Development Environment Setup Script (PowerShell)
################################################################################
#
# This script sets up a local development environment for the HRSA PPRS
# application. It checks dependencies, clones the repository, and configures
# both backend and frontend for local development.
#
# Prerequisites:
#   - Python 3.11+
#   - Node.js 20+
#   - Git
#   - PostgreSQL (local or Azure)
#
# Usage:
#   .\setup-dev-environment.ps1
#
################################################################################

# Stop on errors
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HRSA PPRS - Local Dev Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

################################################################################
# Step 1: Check Prerequisites
################################################################################

Write-Host "Step 1: Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Python
Write-Host "Checking Python..." -ForegroundColor Gray
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python (\d+)\.(\d+)") {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        if ($major -ge 3 -and $minor -ge 11) {
            Write-Host "  ✅ $pythonVersion" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Python 3.11+ required, found $pythonVersion" -ForegroundColor Red
            Write-Host "     Install from: https://www.python.org/downloads/" -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "  ❌ Python not found" -ForegroundColor Red
    Write-Host "     Install from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Gray
try {
    $nodeVersion = node --version 2>&1
    if ($nodeVersion -match "v(\d+)\.") {
        $major = [int]$matches[1]
        if ($major -ge 20) {
            Write-Host "  ✅ Node.js $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Node.js 20+ required, found $nodeVersion" -ForegroundColor Red
            Write-Host "     Install from: https://nodejs.org/" -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "  ❌ Node.js not found" -ForegroundColor Red
    Write-Host "     Install from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Git
Write-Host "Checking Git..." -ForegroundColor Gray
try {
    $gitVersion = git --version 2>&1
    Write-Host "  ✅ $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Git not found" -ForegroundColor Red
    Write-Host "     Install from: https://git-scm.com/downloads" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ All prerequisites met!" -ForegroundColor Green
Write-Host ""

################################################################################
# Step 2: Clone Repository (if needed)
################################################################################

Write-Host "Step 2: Repository Setup..." -ForegroundColor Yellow
Write-Host ""

# Check if already in project directory
if (Test-Path "backend" -PathType Container) {
    Write-Host "  ✅ Already in project directory" -ForegroundColor Green
    $projectDir = Get-Location
} else {
    Write-Host "Repository not found in current directory." -ForegroundColor Gray
    Write-Host ""
    
    $clone = Read-Host "Do you want to clone the repository? (y/n)"
    
    if ($clone -eq "y" -or $clone -eq "Y") {
        Write-Host ""
        Write-Host "GitHub Repository Clone" -ForegroundColor Cyan
        Write-Host "-----------------------" -ForegroundColor Cyan
        
        $repoUrl = Read-Host "Enter GitHub repository URL (e.g., https://github.com/username/repo.git)"
        $pat = Read-Host "Enter GitHub Personal Access Token (PAT)" -AsSecureString
        $patPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pat))
        
        # Construct authenticated URL
        $authenticatedUrl = $repoUrl -replace "https://", "https://${patPlain}@"
        
        Write-Host ""
        Write-Host "Cloning repository..." -ForegroundColor Gray
        
        try {
            git clone $authenticatedUrl
            
            # Extract repo name from URL
            $repoName = ($repoUrl -split "/")[-1] -replace ".git", ""
            Set-Location $repoName
            $projectDir = Get-Location
            
            Write-Host "  ✅ Repository cloned successfully" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ Failed to clone repository" -ForegroundColor Red
            Write-Host "     Error: $_" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "  ❌ Please navigate to the project directory or clone the repository" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

################################################################################
# Step 3: Backend Setup
################################################################################

Write-Host "Step 3: Backend Setup..." -ForegroundColor Yellow
Write-Host ""

Set-Location backend

# Create virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Gray
if (Test-Path "venv" -PathType Container) {
    Write-Host "  ⚠️  Virtual environment already exists, skipping..." -ForegroundColor Yellow
} else {
    python -m venv venv
    Write-Host "  ✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment and install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Gray
Write-Host "  (This may take a few minutes...)" -ForegroundColor Gray

if ($IsWindows -or $env:OS -match "Windows") {
    & .\venv\Scripts\Activate.ps1
} else {
    # For Linux/Mac (if running PowerShell Core)
    & ./venv/bin/Activate.ps1
}

pip install -r requirements.txt --quiet
Write-Host "  ✅ Dependencies installed" -ForegroundColor Green

# Create .env file
Write-Host "Configuring backend environment..." -ForegroundColor Gray

if (Test-Path ".env") {
    Write-Host "  ⚠️  .env file already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "  Do you want to reconfigure? (y/n)"
    
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "  ⏭️  Skipping .env configuration" -ForegroundColor Gray
        Set-Location ..
        goto :SkipBackendEnv
    }
}

Write-Host ""
Write-Host "Database Configuration" -ForegroundColor Cyan
Write-Host "---------------------" -ForegroundColor Cyan
Write-Host "Choose database option:" -ForegroundColor Gray
Write-Host "  1) Local PostgreSQL (localhost)" -ForegroundColor Gray
Write-Host "  2) Azure PostgreSQL (remote)" -ForegroundColor Gray
Write-Host ""

$dbChoice = Read-Host "Enter choice (1 or 2)"

if ($dbChoice -eq "1") {
    # Local PostgreSQL
    Write-Host ""
    Write-Host "Local PostgreSQL Configuration:" -ForegroundColor Cyan
    $dbHost = Read-Host "Database host (default: localhost)" 
    if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }
    
    $dbPort = Read-Host "Database port (default: 5432)"
    if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }
    
    $dbName = Read-Host "Database name (default: rei_pprs_dev)"
    if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "rei_pprs_dev" }
    
    $dbUser = Read-Host "Database username (default: admin)"
    if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "admin" }
    
    $dbPass = Read-Host "Database password (default: admin)"
    if ([string]::IsNullOrWhiteSpace($dbPass)) { $dbPass = "admin" }
    
    $envContent = @"
# Local PostgreSQL Configuration
DATABASE_URL=postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}
PORT=3001
"@
} else {
    # Azure PostgreSQL
    Write-Host ""
    Write-Host "Azure PostgreSQL Configuration:" -ForegroundColor Cyan
    $dbHost = Read-Host "Azure DB Host"
    $dbUser = Read-Host "Azure DB User"
    $dbPass = Read-Host "Azure DB Password"
    $dbName = Read-Host "Azure DB Name (default: rei_pprs_dev)"
    if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "rei_pprs_dev" }
    
    $dbPort = Read-Host "Azure DB Port (default: 5432)"
    if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }
    
    $envContent = @"
# Azure PostgreSQL Configuration
AZURE_DB_HOST=${dbHost}
AZURE_DB_USER=${dbUser}
AZURE_DB_PASSWORD=${dbPass}
AZURE_DB_NAME=${dbName}
AZURE_DB_PORT=${dbPort}
PORT=3001
"@
}

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "  ✅ Backend .env file created" -ForegroundColor Green

:SkipBackendEnv

Set-Location ..
Write-Host ""

################################################################################
# Step 4: Frontend Setup
################################################################################

Write-Host "Step 4: Frontend Setup..." -ForegroundColor Yellow
Write-Host ""

Set-Location frontend

# Install dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Gray
Write-Host "  (This may take a few minutes...)" -ForegroundColor Gray

npm install --silent
Write-Host "  ✅ Dependencies installed" -ForegroundColor Green

# Create .env file
Write-Host "Configuring frontend environment..." -ForegroundColor Gray

$frontendEnv = @"
# Backend URL for local development
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
"@

$frontendEnv | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "  ✅ Frontend .env file created" -ForegroundColor Green

Set-Location ..
Write-Host ""

################################################################################
# Step 5: Summary
################################################################################

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "-----------" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Initialize Database (First time only):" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python database\init_db.py" -ForegroundColor Gray
Write-Host "   python database\seed_data.py" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Start Backend:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python app.py" -ForegroundColor Gray
Write-Host ""
Write-Host "   Backend will run at: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Start Frontend (in a new terminal):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   Frontend will run at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "4. Access Application:" -ForegroundColor Yellow
Write-Host "   URL: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Default Login Credentials:" -ForegroundColor Gray
Write-Host "   Username: admin" -ForegroundColor Gray
Write-Host "   Password: admin" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Happy Coding! 🚀" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
