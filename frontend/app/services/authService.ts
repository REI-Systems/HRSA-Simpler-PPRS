/**
 * Client-side auth helpers. Session is stored in localStorage (key: user).
 * Invalid session = no user in localStorage → redirect to login.
 */
import type { StoredUser } from '../types';

const USER_STORAGE_KEY = 'user';

/**
 * Get the current user from localStorage. Safe to call in browser only.
 */
export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as StoredUser | null;
    return user && (user.username || user.id) ? user : null;
  } catch {
    return null;
  }
}

/**
 * Get display username from stored user.
 */
export function getStoredUsername(): string | null {
  const user = getStoredUser();
  return user ? (user.username || user.email || 'User') : null;
}

/**
 * Clear session (logout). Removes user and JWT token from localStorage.
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('token');
  } catch {
    // ignore
  }
}

/**
 * Logout for all current session: call backend logout then clear local session.
 */
export async function logout(): Promise<void> {
  try {
    const { getBackendUrl } = await import('./api');
    const base = await getBackendUrl();
    await fetch(`${base}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // Proceed with local logout even if backend is unreachable
  }
  clearSession();
}
