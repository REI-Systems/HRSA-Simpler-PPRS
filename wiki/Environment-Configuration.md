# Environment Configuration

## Backend (.env)

Create from `.env.example` in the `backend` directory.

### Local PostgreSQL

```bash
DATABASE_URL=postgresql://admin:admin@localhost:5432/rei_community_dev
PORT=3001
```

### Azure PostgreSQL

```bash
AZURE_DB_HOST=your-host.eastus.azurecontainer.io
AZURE_DB_USER=admin
AZURE_DB_PASSWORD=your-password
AZURE_DB_NAME=rei_pprs_dev
AZURE_DB_PORT=5432
PORT=3001
```

The app uses `config/database.py` to build the connection (often from `DATABASE_URL` or from `AZURE_DB_*` variables).

---

## Frontend

### Local development

- Backend URL is often read from `NEXT_PUBLIC_BACKEND_URL` or a config file (e.g. `config.json`).
- Default: `http://localhost:3001`.

Create `frontend/.env.local` if needed:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Production / Azure

Set `NEXT_PUBLIC_BACKEND_URL` (or equivalent) to the deployed backend URL so the frontend calls the correct API. The GitHub Actions workflow uses `AZURE_BACKEND_URL` as a build arg for the frontend image.

---

## GitHub Secrets (CI/CD)

For `.github/workflows/build-docker.yml`:

| Secret | Purpose |
|--------|---------|
| `ACR_LOGIN_SERVER` | Azure Container Registry URL (e.g. `reiopensourcepoc.azurecr.io`) |
| `ACR_USERNAME` | ACR username |
| `ACR_PASSWORD` | ACR password |
| `AZURE_BACKEND_URL` | Backend URL for Azure (used as `NEXT_PUBLIC_BACKEND_URL` when building frontend) |

Optional: `AZURE_DB_URL` or similar if the workflow needs to run DB migrations or seeds.
