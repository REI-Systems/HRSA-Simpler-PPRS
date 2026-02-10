/**
 * Service for layout data (header nav, etc.).
 */
import { apiGet } from './api';

export async function getHeaderNav(): Promise<Array<{ id: string; label: string; href: string }>> {
  const data = (await apiGet('/api/layout/header-nav')) as { items?: Array<{ id: string; label: string; href: string }> };
  return data.items ?? [];
}
