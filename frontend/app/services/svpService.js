/**
 * Service for Site Visit Plan (SVP) page data.
 */
import { apiGet, apiPost } from './api';

export async function getPlans() {
  const data = await apiGet('/api/svp/plans');
  return data.plans ?? [];
}

export async function getPlanById(id) {
  return apiGet('/api/svp/plans/' + encodeURIComponent(id));
}

export async function createPlan(payload) {
  return apiPost('/api/svp/plans', payload);
}

export async function getConfig() {
  return apiGet('/api/svp/config');
}

export async function getInitiateOptions() {
  return apiGet('/api/svp/initiate/options');
}
