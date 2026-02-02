/**
 * API client. Resolves backend URL by environment:
 * - Dev mode (next dev): uses localhost or NEXT_PUBLIC_BACKEND_URL
 * - Prod mode: uses NEXT_PUBLIC_BACKEND_URL or config.json activeEnvironment
 */
const DEV_BACKEND_URL = 'http://localhost:3001';
let cachedBackendUrl = null;

export async function getBackendUrl() {
  if (cachedBackendUrl) return cachedBackendUrl;

  const isDev = process.env.NODE_ENV === 'development';
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (envUrl) {
    cachedBackendUrl = envUrl;
    return cachedBackendUrl;
  }

  if (isDev) {
    cachedBackendUrl = DEV_BACKEND_URL;
    return cachedBackendUrl;
  }

  const res = await fetch('/config.json');
  const config = await res.json();
  const activeEnv = config.activeEnvironment || 'production';
  cachedBackendUrl = config.environments?.[activeEnv]?.backendUrl || DEV_BACKEND_URL;
  return cachedBackendUrl;
}

export async function apiGet(path) {
  const base = await getBackendUrl();
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(res.statusText || 'API request failed');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function apiPost(path, body) {
  const base = await getBackendUrl();
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = new Error(res.statusText || 'API request failed');
    err.status = res.status;
    throw err;
  }
  return res.json();
}
