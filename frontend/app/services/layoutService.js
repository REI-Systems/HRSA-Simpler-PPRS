/**
 * Service for layout data (header nav, etc.).
 */
import { apiGet } from './api';

export async function getHeaderNav() {
  const data = await apiGet('/api/layout/header-nav');
  return data.items ?? [];
}
