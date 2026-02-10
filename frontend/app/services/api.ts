/**
 * API client. Resolves backend URL by environment:
 * - Dev mode (next dev): uses localhost or NEXT_PUBLIC_BACKEND_URL
 * - Prod mode: uses NEXT_PUBLIC_BACKEND_URL or config.json activeEnvironment
 */
import type { ApiError } from '../types';

const DEV_BACKEND_URL = 'http://localhost:3001';
let cachedBackendUrl: string | null = null;

export async function getBackendUrl(): Promise<string> {
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
    const config = (await res.json()) as { activeEnvironment?: string; environments?: Record<string, { backendUrl?: string }> };
    const activeEnv = config.activeEnvironment || 'production';
    const envUrlFromConfig = config.environments?.[activeEnv]?.backendUrl;
    cachedBackendUrl = envUrlFromConfig || DEV_BACKEND_URL;
    return cachedBackendUrl;
  } catch {
    cachedBackendUrl = DEV_BACKEND_URL;
    return cachedBackendUrl;
  }
}

function createApiError(message: string, status: number, extra?: { detail?: string; incomplete_sections?: string[] }): ApiError {
  const err = new Error(message) as ApiError;
  err.status = status;
  if (extra?.detail) err.detail = extra.detail;
  if (extra?.incomplete_sections) err.incomplete_sections = extra.incomplete_sections;
  return err;
}

/**
 * Dispatch activity event to reset session timeout tracking.
 * API calls count as user activity since they indicate the user is actively using the app.
 */
function dispatchActivityEvent(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apiActivity'));
  }
}

/**
 * Handle authentication errors (401) by clearing local session.
 * This ensures that when backend session expires, frontend state is also cleared.
 */
async function handleAuthError(res: Response): Promise<void> {
  if (res.status === 401 && typeof window !== 'undefined') {
    // Clear local session storage
    try {
      localStorage.removeItem('user');
    } catch {
      // Ignore localStorage errors
    }
    
    // Store session expired message for display
    const body = await res.json().catch(() => ({})) as { message?: string };
    const message = body?.message || 'Session expired. Please log in again.';
    
    // Only redirect if we're not already on the login page
    if (!window.location.pathname.includes('/login')) {
      // Store the message in sessionStorage so login page can display it
      try {
        sessionStorage.setItem('sessionExpiredMessage', message);
      } catch {
        // Ignore sessionStorage errors
      }
      // Redirect to login page
      window.location.href = '/login';
    }
  }
}

export async function apiGet(path: string): Promise<unknown> {
  try {
    const base = await getBackendUrl();
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(url, {
      credentials: 'include',
    });

    if (!res.ok) {
      await handleAuthError(res);
      const body = await res.json().catch(() => ({})) as { error?: string; message?: string };
      const err = createApiError(body?.message ?? body?.error ?? res.statusText ?? 'API request failed', res.status);
      throw err;
    }

    // Successful API call counts as activity - reset session timeout tracking
    dispatchActivityEvent();
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend server is running.') as ApiError;
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

export async function apiPost(path: string, body: unknown): Promise<unknown> {
  try {
    const base = await getBackendUrl();
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (!res.ok) {
      await handleAuthError(res);
      const resBody = await res.json().catch(() => ({})) as { error?: string; message?: string };
      throw createApiError(resBody?.message ?? resBody?.error ?? res.statusText ?? 'API request failed', res.status);
    }

    // Successful API call counts as activity - reset session timeout tracking
    dispatchActivityEvent();
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend server is running.') as ApiError;
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

export async function apiPatch(path: string, body: unknown): Promise<unknown> {
  try {
    const base = await getBackendUrl();
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (!res.ok) {
      await handleAuthError(res);
      const data = await res.json().catch(() => ({})) as { error?: string; message?: string; detail?: string; incomplete_sections?: string[] };
      const err = createApiError(data?.message ?? data?.error ?? res.statusText ?? 'API request failed', res.status, {
        detail: data?.detail,
        incomplete_sections: data?.incomplete_sections,
      });
      throw err;
    }

    // Successful API call counts as activity - reset session timeout tracking
    dispatchActivityEvent();
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend server is running.') as ApiError;
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

export async function apiPostMultipart(path: string, formData: FormData): Promise<unknown> {
  try {
    const base = await getBackendUrl();
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      await handleAuthError(res);
      const body = await res.json().catch(() => ({})) as { error?: string; message?: string };
      throw createApiError(body?.message ?? body?.error ?? res.statusText ?? 'API request failed', res.status);
    }

    // Successful API call counts as activity - reset session timeout tracking
    dispatchActivityEvent();
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend server is running.') as ApiError;
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

export async function apiDelete(path: string): Promise<unknown> {
  try {
    const base = await getBackendUrl();
    const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
    const res = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      await handleAuthError(res);
      const body = await res.json().catch(() => ({})) as { error?: string; message?: string };
      throw createApiError(body?.message ?? body?.error ?? res.statusText ?? 'API request failed', res.status);
    }

    // Successful API call counts as activity - reset session timeout tracking
    dispatchActivityEvent();
    
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined;
    }
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to server. Please check if the backend server is running.') as ApiError;
      networkError.status = 0;
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}
