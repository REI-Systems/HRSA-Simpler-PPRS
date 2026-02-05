/**
 * Service for welcome page data.
 */
import { apiGet } from './api';

/**
 * Fetch welcome message from backend (title, message).
 * Returns null on 404 or error so UI can show fallback.
 */
export async function getWelcomeMessage() {
  try {
    const data = await apiGet('/api/welcome');
    return data && (data.title != null || data.message != null)
      ? { title: data.title || '', message: data.message || '' }
      : null;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}
