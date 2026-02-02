/**
 * Service for welcome / home page data.
 */
import { apiGet } from './api';

export async function getWelcome() {
  return apiGet('/api/welcome');
}
