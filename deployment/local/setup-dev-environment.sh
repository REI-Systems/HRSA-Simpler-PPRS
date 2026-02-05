#!/bin/bash

################################################################################
# Local Development Environment Setup Script (Bash)
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
#   ./setup-dev-environment.sh
#
################################################################################

set -e  # Exit on error

echo "========================================"
echo "HRSA PPRS - Local Dev Environment Setup"
echo "========================================"
echo ""

################################################################################
# Step 1: Check Prerequisites
################################################################################

echo "Step 1: Checking Prerequisites..."
echo ""

# Check Python
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    
    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 11 ]; then
        echo "  ✅ Python $PYTHON_VERSION"
        PYTHON_CMD="python3"
    else
        echo "  ❌ Python 3.11+ required, found $PYTHON_VERSION"
        echo "     Install from: https://www.python.org/downloads/"
        exit 1
    fi
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    
    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 11 ]; then
        echo "  ✅ Python $PYTHON_VERSION"
        PYTHON_CMD="python"
    else
        echo "  ❌ Python 3.11+ required, found $PYTHON_VERSION"
        echo "     Install from: https://www.python.org/downloads/"
        exit 1
    fi
else
    echo "  ❌ Python not found"
    echo "     Install from: https://www.python.org/downloads/"
    exit 1
fi

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>&1)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
    
    if [ "$NODE_MAJOR" -ge 20 ]; then
        echo "  ✅ Node.js $NODE_VERSION"
    else
        echo "  ❌ Node.js 20+ required, found $NODE_VERSION"
        echo "     Install from: https://nodejs.org/"
        exit 1
    fi
else
    echo "  ❌ Node.js not found"
    echo "     Install from: https://nodejs.org/"
    exit 1
fi

# Check Git
echo "Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version 2>&1)
    echo "  ✅ $GIT_VERSION"
else
    echo "  ❌ Git not found"
    echo "     Install from: https://git-scm.com/downloads"
    exit 1
fi

echo ""
echo "✅ All prerequisites met!"
echo ""

################################################################################
# Step 2: Clone Repository (if needed)
################################################################################

echo "Step 2: Repository Setup..."
echo ""

# Check if already in project directory
if [ -d "backend" ]; then
    echo "  ✅ Already in project directory"
    PROJECT_DIR=$(pwd)
else
    echo "Repository not found in current directory."
    echo ""
    
    read -p "Do you want to clone the repository? (y/n): " CLONE
    
    if [ "$CLONE" = "y" ] || [ "$CLONE" = "Y" ]; then
        echo ""
        echo "GitHub Repository Clone"
        echo "-----------------------"
        
        read -p "Enter GitHub repository URL (e.g., https://github.com/username/repo.git): " REPO_URL
        read -sp "Enter GitHub Personal Access Token (PAT): " PAT
        echo ""
        
        # Construct authenticated URL
        AUTHENTICATED_URL=$(echo $REPO_URL | sed "s|https://|https://${PAT}@|")
        
        echo ""
        echo "Cloning repository..."
        
        if git clone $AUTHENTICATED_URL; then
            # Extract repo name from URL
            REPO_NAME=$(basename $REPO_URL .git)
            cd $REPO_NAME
            PROJECT_DIR=$(pwd)
            
            echo "  ✅ Repository cloned successfully"
        else
            echo "  ❌ Failed to clone repository"
            exit 1
        fi
    else
        echo "  ❌ Please navigate to the project directory or clone the repository"
        exit 1
    fi
fi

echo ""

################################################################################
# Step 3: Backend Setup
################################################################################

echo "Step 3: Backend Setup..."
echo ""

cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
if [ -d "venv" ]; then
    echo "  ⚠️  Virtual environment already exists, skipping..."
else
    $PYTHON_CMD -m venv venv
    echo "  ✅ Virtual environment created"
fi

# Activate virtual environment and install dependencies
echo "Installing Python dependencies..."
echo "  (This may take a few minutes...)"

source venv/bin/activate
pip install -r requirements.txt --quiet
echo "  ✅ Dependencies installed"

# Create .env file
echo "Configuring backend environment..."

if [ -f ".env" ]; then
    echo "  ⚠️  .env file already exists"
    read -p "  Do you want to reconfigure? (y/n): " OVERWRITE
    
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "  ⏭️  Skipping .env configuration"
        cd ..
        SKIP_BACKEND_ENV=true
    fi
fi

if [ "$SKIP_BACKEND_ENV" != "true" ]; then
    echo ""
    echo "Database Configuration"
    echo "---------------------"
    echo "Choose database option:"
    echo "  1) Local PostgreSQL (localhost)"
    echo "  2) Azure PostgreSQL (remote)"
    echo ""
    
    read -p "Enter choice (1 or 2): " DB_CHOICE
    
    if [ "$DB_CHOICE" = "1" ]; then
        # Local PostgreSQL
        echo ""
        echo "Local PostgreSQL Configuration:"
        read -p "Database host (default: localhost): " DB_HOST
        DB_HOST=${DB_HOST:-localhost}
        
        read -p "Database port (default: 5432): " DB_PORT
        DB_PORT=${DB_PORT:-5432}
        
        read -p "Database name (default: rei_pprs_dev): " DB_NAME
        DB_NAME=${DB_NAME:-rei_pprs_dev}
        
        read -p "Database username (default: admin): " DB_USER
        DB_USER=${DB_USER:-admin}
        
        read -sp "Database password (default: admin): " DB_PASS
        DB_PASS=${DB_PASS:-admin}
        echo ""
        
        cat > .env << EOF
# Local PostgreSQL Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}
PORT=3001
EOF
    else
        # Azure PostgreSQL
        echo ""
        echo "Azure PostgreSQL Configuration:"
        read -p "Azure DB Host: " DB_HOST
        read -p "Azure DB User: " DB_USER
        read -sp "Azure DB Password: " DB_PASS
        echo ""
        read -p "Azure DB Name (default: rei_pprs_dev): " DB_NAME
        DB_NAME=${DB_NAME:-rei_pprs_dev}
        
        read -p "Azure DB Port (default: 5432): " DB_PORT
        DB_PORT=${DB_PORT:-5432}
        
        cat > .env << EOF
# Azure PostgreSQL Configuration
AZURE_DB_HOST=${DB_HOST}
AZURE_DB_USER=${DB_USER}
AZURE_DB_PASSWORD=${DB_PASS}
AZURE_DB_NAME=${DB_NAME}
AZURE_DB_PORT=${DB_PORT}
PORT=3001
EOF
    fi
    
    echo "  ✅ Backend .env file created"
    cd ..
fi

echo ""

################################################################################
# Step 4: Frontend Setup
################################################################################

echo "Step 4: Frontend Setup..."
echo ""

cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
echo "  (This may take a few minutes...)"

npm install --silent
echo "  ✅ Dependencies installed"

# Create .env file
echo "Configuring frontend environment..."

cat > .env << EOF
# Backend URL for local development
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
EOF

echo "  ✅ Frontend .env file created"

cd ..
echo ""

################################################################################
# Step 5: Summary
################################################################################

echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""

echo "Next Steps:"
echo "-----------"
echo ""

echo "1. Initialize Database (First time only):"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python database/init_db.py"
echo "   python database/seed_data.py"
echo ""

echo "2. Start Backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "   Backend will run at: http://localhost:3001"
echo ""

echo "3. Start Frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "   Frontend will run at: http://localhost:3000"
echo ""

echo "4. Access Application:"
echo "   URL: http://localhost:3000/login"
echo ""
echo "   Default Login Credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo ""

echo "========================================"
echo "Happy Coding! 🚀"
echo "========================================"
