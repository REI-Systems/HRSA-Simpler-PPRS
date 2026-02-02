/**
 * Service for sidebar menu data.
 */
import { apiGet } from './api';

export async function getMenu() {
  const data = await apiGet('/api/menu');
  return data.items ?? [];
}
