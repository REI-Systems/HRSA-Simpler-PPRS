# Development Guide

## 🚀 Local Development Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 15+** (or use Azure PostgreSQL)
- **Git**

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

For full setup (environment, database init, seed), see [README](README.md#-detailed-local-setup) or [wiki/Getting-Started](wiki/Getting-Started.md).

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Branching model

This project follows **trunk-based development**: all contributions target the `main` branch. Work is done on short-lived feature branches, then merged into `main` via pull requests (squash merge).

---

## Git Workflow

### Create Feature Branch

```bash
# Sync with main
git checkout main
git pull origin main

# Create feature branch
git checkout -b yourname/issue-123-feature-description

# Make changes and commit
git add .
git commit -m "Add feature description"

# Push to remote
git push origin yourname/issue-123-feature-description
```

### Branch Naming

**Format:** `yourname/issue-number-description`

**Examples:**

- `jsmith/issue-123-add-user-profile`
- `adoe/issue-456-fix-login-bug`

---

## 📝 Pull Requests

### Title Format

- `[Issue 123] Add user profile page`
- `[Issue 456] Fix login validation error`
- `[Hotfix] Fix critical bug`

### Description Template

```markdown
## Description
What this PR does and why.

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z component

## Testing
- [ ] Tested locally
- [ ] Backend tests pass
- [ ] Frontend works correctly
```

### Process

1. Create PR on GitHub
2. Assign reviewers
3. Address review comments
4. Once approved, author merges using **squash merge**

---

## 👀 Code Review Guidelines

- **Be prompt** — Respond within 24 hours
- **Be kind** — Collaborative and respectful tone
- **Explain suggestions** — Help others learn
- **Praise good work** — Highlight what's done well
- **Mark optional vs required** — Be clear about what must change
