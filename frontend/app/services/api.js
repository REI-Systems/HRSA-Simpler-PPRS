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

  try {
    const res = await fetch('/config.json');
    if (!res.ok) {
      cachedBackendUrl = DEV_BACKEND_URL;
      return cachedBackendUrl;
    }
    const config = await res.json();
    const activeEnv = config.activeEnvironment || 'production';
    const envUrl = config.environments?.[activeEnv]?.backendUrl;
    cachedBackendUrl = envUrl || DEV_BACKEND_URL;
    return cachedBackendUrl;
  } catch (_) {
    // config.json missing, invalid, or network error: use default
    cachedBackendUrl = DEV_BACKEND_URL;
    return cachedBackendUrl;
  }
}

export async function apiGet(path) {
  try {
    const base = await getBackendUrl();
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      const err = new Error(res.statusText || 'API request failed');
      err.status = res.status;
      try {
        const body = await res.json();
        if (body && typeof body.error === 'string') {
          err.message = body.error;
        }
      } catch (_) {
        // Response is not JSON, use status text
      }
      throw err;
    }
    
    return res.json();
  } catch (error) {
    // Handle network errors (server unavailable, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend server is running.');
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    // Re-throw other errors (including HTTP errors)
    throw error;
  }
}

export async function apiPost(path, body) {
  try {
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
      try {
        const body = await res.json();
        if (body && typeof body.error === 'string') {
          err.message = body.error;
        }
      } catch (_) {
        // Response is not JSON, use status text
      }
      throw err;
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend server is running.');
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

export async function apiPatch(path, body) {
  try {
    const base = await getBackendUrl();
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const err = new Error(res.statusText || 'API request failed');
      err.status = res.status;
      try {
        const data = await res.json();
        if (data && typeof data.error === 'string') {
          err.message = data.error;
        }
        if (data && typeof data.detail === 'string') {
          err.detail = data.detail;
        }
        if (data && Array.isArray(data.incomplete_sections)) {
          err.incomplete_sections = data.incomplete_sections;
        }
      } catch (_) {
        // Response is not JSON, use status text
      }
      throw err;
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend server is running.');
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

export async function apiPostMultipart(path, formData) {
  try {
    const base = await getBackendUrl();
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const err = new Error(res.statusText || 'API request failed');
      err.status = res.status;
      try {
        const body = await res.json();
        if (body && typeof body.error === 'string') {
          err.message = body.error;
        }
      } catch (_) {
        // Response is not JSON, use status text
      }
      throw err;
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend server is running.');
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

export async function apiDelete(path) {
  try {
    const base = await getBackendUrl();
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(url, { method: 'DELETE' });
    
    if (!res.ok) {
      const err = new Error(res.statusText || 'API request failed');
      err.status = res.status;
      try {
        const body = await res.json();
        if (body && typeof body.error === 'string') {
          err.message = body.error;
        }
      } catch (_) {
        // Response is not JSON, use status text
      }
      throw err;
    }
    
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined;
    }
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend server is running.');
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}
