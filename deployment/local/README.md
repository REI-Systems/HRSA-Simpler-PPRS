# Local Development Setup

This directory contains scripts for setting up a local development environment for the HRSA PPRS application.

---

## 📁 Contents

| Script | Description |
|--------|-------------|
| `setup-dev-environment.sh` | Bash script for Linux/macOS setup |
| `setup-dev-environment.ps1` | PowerShell script for Windows setup |

---

## 🚀 Quick Start

### Prerequisites

Before running the setup script, ensure you have:

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/downloads)
- **PostgreSQL** - Local installation or Azure PostgreSQL access
- **GitHub Personal Access Token (PAT)** - If cloning from private repository

---

## 📝 Usage

### Windows (PowerShell)

```powershell
# Download or navigate to the script
cd deployment\local

# Run the setup script
.\setup-dev-environment.ps1
```

### Linux/macOS (Bash)

```bash
# Download or navigate to the script
cd deployment/local

# Make script executable
chmod +x setup-dev-environment.sh

# Run the setup script
./setup-dev-environment.sh
```

---

## 🔍 What the Script Does

### 1. **Checks Prerequisites** ✅
- Verifies Python 3.11+ is installed
- Verifies Node.js 20+ is installed
- Verifies Git is installed

### 2. **Repository Setup** 📦
- Checks if already in project directory
- Optionally clones repository from GitHub using PAT
- Navigates to project root

### 3. **Backend Setup** 🐍
- Creates Python virtual environment
- Installs Python dependencies from `requirements.txt`
- Creates `backend/.env` file with database configuration
- Supports both local and Azure PostgreSQL

### 4. **Frontend Setup** ⚛️
- Installs Node.js dependencies
- Creates `frontend/.env` file with backend URL

### 5. **Summary** 📊
- Displays next steps to initialize database
- Shows commands to start backend and frontend
- Provides login credentials

---

## ⚙️ Configuration Options

### Database Configuration

The script will prompt you to choose:

#### Option 1: Local PostgreSQL
```
Host: localhost
Port: 5432
Database: rei_pprs_dev
Username: admin
Password: admin
```

**backend/.env:**
```bash
DATABASE_URL=postgresql://admin:admin@localhost:5432/rei_pprs_dev
PORT=3001
```

#### Option 2: Azure PostgreSQL
```
Host: <your-azure-host>
Port: 5432
Database: rei_pprs_dev
Username: <your-username>
Password: <your-password>
```

**backend/.env:**
```bash
AZURE_DB_HOST=<your-azure-host>
AZURE_DB_USER=<your-username>
AZURE_DB_PASSWORD=<your-password>
AZURE_DB_NAME=rei_pprs_dev
AZURE_DB_PORT=5432
PORT=3001
```

### Frontend Configuration

**frontend/.env:**
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

---

## 🎯 After Setup

### 1. Initialize Database (First Time Only)

```bash
cd backend
source venv/bin/activate  # Linux/macOS
# or
.\venv\Scripts\Activate.ps1  # Windows

python database/init_db.py
python database/seed_data.py
```

### 2. Start Backend

```bash
cd backend
source venv/bin/activate  # Linux/macOS
# or
.\venv\Scripts\Activate.ps1  # Windows

python app.py
```

**Backend URL:** http://localhost:3001

### 3. Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

**Frontend URL:** http://localhost:3000

### 4. Access Application

**URL:** http://localhost:3000/login

**Default Credentials:**
- Username: `admin`
- Password: `admin`

---

## 🔧 Manual Setup (Alternative)

If you prefer to set up manually without the script:

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
.\venv\Scripts\Activate.ps1  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://admin:admin@localhost:5432/rei_pprs_dev
PORT=3001
EOF

# Initialize database
python database/init_db.py
python database/seed_data.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
EOF
```

---

## 🆘 Troubleshooting

### Python Version Issues

**Error:** `Python 3.11+ required`

**Solution:**
- Install Python 3.11 or higher from https://www.python.org/downloads/
- Ensure Python is in your PATH

### Node.js Version Issues

**Error:** `Node.js 20+ required`

**Solution:**
- Install Node.js 20 or higher from https://nodejs.org/
- Or use nvm: `nvm install 20 && nvm use 20`

### Port Already in Use

**Error:** `Port 3001 or 3000 already in use`

**Solution (Windows):**
```powershell
# Find process using port
netstat -ano | findstr :3001
# Kill process
taskkill /PID <PID> /F
```

**Solution (Linux/macOS):**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
```

### Database Connection Error

**Error:** `Could not connect to database`

**Solution:**
- Verify PostgreSQL is running
- Check database credentials in `backend/.env`
- Ensure database `rei_pprs_dev` exists
- Test connection: `psql -h localhost -U admin -d rei_pprs_dev`

### Virtual Environment Activation Issues

**Windows PowerShell Error:** `Execution policy error`

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### npm Install Fails

**Error:** `npm install fails with permission errors`

**Solution:**
- Run terminal as administrator (Windows)
- Use `sudo npm install` (Linux/macOS) - not recommended
- Fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors

---

## 📚 Additional Resources

- [Python Virtual Environments](https://docs.python.org/3/tutorial/venv.html)
- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [GitHub PAT Creation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

---

## 🔐 Security Notes

- **Never commit `.env` files** to version control
- **Keep your GitHub PAT secure** - it provides access to your repositories
- **Use strong passwords** for production databases
- **The default credentials** (admin/admin) are for local development only

---

## 💡 Tips

- Use **separate terminals** for backend and frontend to see logs clearly
- **Activate virtual environment** every time you work on the backend
- **Hot reload** is enabled - changes will reflect automatically
- Check **backend logs** at http://localhost:3001/health for status
