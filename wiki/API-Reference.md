# API Reference

Base URL (local): `http://localhost:3001`. All responses are JSON.

---

## Authentication

### POST /api/auth/login

Authenticate and get user info.

**Request body:**

```json
{
  "username": "admin",
  "password": "admin"
}
```

**Success (200):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

**Error (400):** Missing username or password.  
**Error (401):** Invalid credentials.  
**Error (503):** Database unavailable.

---

### POST /api/auth/logout

Stateless logout; client should clear local session/token.

**Response (200):** `{ "success": true }`

---

## Welcome

### GET /api/welcome

**Success (200):**

```json
{
  "title": "Welcome to REI Systems",
  "message": "Community Development!",
  "timestamp": "2026-02-03T12:00:00.000000"
}
```

**Error (404):** No welcome message. **500:** Server error.

---

## Layout

### GET /api/menu

Sidebar menu (parent items with children).

**Success (200):** `{ "items": [ { "id", "label", "expanded", "children": [ { "id", "label", "href?", "header?" } ] } ] }`

### GET /api/layout/header-nav

Header navigation links.

**Success (200):** `{ "items": [ { "id", "label", "href" } ] }`

---

## Site Visit Plans (SVP)

### GET /api/svp/plans

List all site visit plans.

**Success (200):** `{ "plans": [ ... ] }`

### POST /api/svp/plans

Create a new plan. Body matches initiate form payload (e.g. plan_for, plan_period, plan_name, etc.).

**Success (201):** Created plan object.

**Error (500):** Failed to create plan.

### GET /api/svp/plans/<plan_id>

Get one plan by ID.

**Success (200):** Plan object (including sections if applicable).

**Error (404):** Plan not found. **500:** Server error.

### GET /api/svp/config

SVP grid and search form configuration (columns, center-align columns, row actions, search fields, default values).

**Success (200):** Config object.

### GET /api/svp/initiate/options

Options for the initiate form (dropdowns, lookups).

**Success (200):** Options object.

---

## Health

### GET /health or GET /api/health

**Response (200):** `{ "status": "healthy", "service": "python-backend" }`
