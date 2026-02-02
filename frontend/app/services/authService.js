/**
 * Client-side auth helpers. Session is stored in localStorage (key: user).
 * Invalid session = no user in localStorage → redirect to login.
 */

const USER_STORAGE_KEY = 'user';

/**
 * Get the current user from localStorage. Safe to call in browser only.
 * @returns {{ id, username, email } | null}
 */
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && (user.username || user.id) ? user : null;
  } catch {
    return null;
  }
}

/**
 * Get display username from stored user.
 * @returns {string | null}
 */
export function getStoredUsername() {
  const user = getStoredUser();
  return user ? (user.username || user.email || 'User') : null;
}

/**
 * Clear session (logout). Removes user from localStorage.
 */
export function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {}
}

/**
 * Logout for all current session: call backend logout then clear local session.
 * Backend can invalidate server-side sessions; client always clears localStorage.
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const { getBackendUrl } = await import('./api');
    const base = await getBackendUrl();
    await fetch(`${base}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // Proceed with local logout even if backend is unreachable
  }
  clearSession();
}
