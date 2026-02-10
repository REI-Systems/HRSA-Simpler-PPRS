/**
 * Service for welcome page data.
 */
import type { ApiError } from '../types';
import { apiGet } from './api';

/**
 * Fetch welcome message from backend (title, message).
 * Returns null on 404 or error so UI can show fallback.
 */
export async function getWelcomeMessage(): Promise<{ title: string; message: string } | null> {
  try {
    const data = (await apiGet('/api/welcome')) as { title?: string; message?: string } | null;
    return data && (data.title != null || data.message != null)
      ? { title: data.title ?? '', message: data.message ?? '' }
      : null;
  } catch (err) {
    if ((err as ApiError).status === 404) return null;
    throw err;
  }
}
