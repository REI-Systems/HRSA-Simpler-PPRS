/**
 * Service for Site Visit Plan (SVP) page data.
 */
import { apiGet, apiPost, apiPatch, apiPostMultipart, apiDelete } from './api';
import { getStoredUsername } from './authService';

export async function getPlans(username: string | null = null): Promise<unknown[]> {
  const url = username
    ? '/api/svp/plans?username=' + encodeURIComponent(username)
    : '/api/svp/plans';
  const data = (await apiGet(url)) as { plans?: unknown[] };
  return data.plans ?? [];
}

/**
 * Record that the current user accessed a plan (for backend recent-plans ordering).
 */
export async function recordPlanAccess(planId: string): Promise<void> {
  const username = typeof window !== 'undefined' ? getStoredUsername() : null;
  if (!username || !planId) return;
  try {
    await apiPost('/api/svp/plans/' + encodeURIComponent(planId) + '/access', { username });
  } catch {
    // ignore
  }
}

export async function getPlanById(id: string): Promise<unknown> {
  const path = '/api/svp/plans/' + encodeURIComponent(id);
  return apiGet(path + (path.includes('?') ? '&' : '?') + '_=' + Date.now());
}

export async function createPlan(payload: unknown): Promise<unknown> {
  return apiPost('/api/svp/plans', payload);
}

/** Cancel/delete a plan (removes plan and all related data). */
export async function cancelPlan(planId: string): Promise<unknown> {
  return apiDelete('/api/svp/plans/' + encodeURIComponent(planId));
}

/** Update plan status (e.g. to "Complete"). Returns updated plan. */
export async function updatePlanStatus(planId: string, status: string): Promise<unknown> {
  return apiPatch('/api/svp/plans/' + encodeURIComponent(planId), { status });
}

/** Mark plan as Complete (convenience wrapper). */
export async function completePlan(planId: string): Promise<unknown> {
  return updatePlanStatus(planId, 'Complete');
}

export async function getConfig(): Promise<unknown> {
  return apiGet('/api/svp/config');
}

export async function getInitiateOptions(): Promise<unknown> {
  return apiGet('/api/svp/initiate/options');
}

export interface UpdateCoversheetPayload {
  planName?: string;
  planDescription?: string;
  action?: 'save' | 'save_and_continue' | 'mark_complete';
}

/** Coversheet: update plan name/description; optional action. */
export async function updateCoversheet(planId: string, payload: UpdateCoversheetPayload = {}): Promise<unknown> {
  const planName = payload.planName != null ? String(payload.planName) : '';
  const planDescription = payload.planDescription != null ? String(payload.planDescription) : '';
  const action = payload.action;
  const body: Record<string, string | undefined> = { planName, planDescription };
  if (action) body.action = action;
  return apiPatch('/api/svp/plans/' + encodeURIComponent(planId) + '/coversheet', body);
}

export async function getCoversheetAttachments(planId: string): Promise<unknown[]> {
  const data = (await apiGet(
    '/api/svp/plans/' + encodeURIComponent(planId) + '/coversheet/attachments'
  )) as { attachments?: unknown[] };
  return data.attachments ?? [];
}

export async function uploadCoversheetAttachment(planId: string, file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);
  return apiPostMultipart(
    '/api/svp/plans/' + encodeURIComponent(planId) + '/coversheet/attachments',
    formData
  );
}

export async function deleteCoversheetAttachment(planId: string, storedName: string): Promise<unknown> {
  return apiDelete(
    '/api/svp/plans/' +
      encodeURIComponent(planId) +
      '/coversheet/attachments/' +
      encodeURIComponent(storedName)
  );
}

export async function getPlanEntities(planId: string): Promise<unknown[]> {
  const data = (await apiGet('/api/svp/plans/' + encodeURIComponent(planId) + '/entities')) as { entities?: unknown[] };
  return data.entities ?? [];
}

export interface AvailableEntitiesSearchParams {
  entity_number?: string;
  entity_name?: string;
  city?: string;
  state?: string;
}

export async function getAvailableEntities(planId: string, searchParams: AvailableEntitiesSearchParams = {}): Promise<unknown[]> {
  const params = new URLSearchParams();
  if (searchParams.entity_number) params.append('entity_number', searchParams.entity_number);
  if (searchParams.entity_name) params.append('entity_name', searchParams.entity_name);
  if (searchParams.city) params.append('city', searchParams.city);
  if (searchParams.state) params.append('state', searchParams.state);
  const queryString = params.toString();
  const url = '/api/svp/plans/' + encodeURIComponent(planId) + '/entities/available' + (queryString ? '?' + queryString : '');
  const data = (await apiGet(url)) as { entities?: unknown[] };
  return data.entities ?? [];
}

export async function addEntityToPlan(planId: string, entityId: string): Promise<unknown> {
  return apiPost('/api/svp/plans/' + encodeURIComponent(planId) + '/entities', { entityId });
}

export async function removeEntityFromPlan(planId: string, entityId: string): Promise<unknown> {
  return apiDelete('/api/svp/plans/' + encodeURIComponent(planId) + '/entities/' + encodeURIComponent(entityId));
}

export async function updateEntityStatus(planId: string, entityId: string, status: string): Promise<unknown> {
  return apiPatch('/api/svp/plans/' + encodeURIComponent(planId) + '/entities/' + encodeURIComponent(entityId), { status });
}

/** Start an identified site visit for an entity (sets visit_started). */
export async function startEntityVisit(planId: string, entityId: string): Promise<unknown> {
  const data = (await apiPatch(
    '/api/svp/plans/' + encodeURIComponent(planId) + '/entities/' + encodeURIComponent(entityId),
    { visit_started: true }
  )) as { entities?: unknown[] };
  return data?.entities ?? data;
}

/** Update a plan section's status (e.g. selected_entities, cover_sheet). */
export async function updatePlanSectionStatus(planId: string, sectionId: string, status: string): Promise<unknown> {
  return apiPatch(
    '/api/svp/plans/' + encodeURIComponent(planId) + '/sections/' + encodeURIComponent(sectionId),
    { status }
  );
}

/** Basic Information: get plan-entity basic info. */
export async function getBasicInfo(planId: string, entityId: string): Promise<unknown> {
  return apiGet(
    '/api/svp/plans/' + encodeURIComponent(planId) + '/entities/' + encodeURIComponent(entityId) + '/basic-info'
  );
}

/** Basic Information: get option lists for dropdowns/checkboxes. */
export async function getBasicInfoOptions(): Promise<unknown> {
  return apiGet('/api/svp/basic-info/options');
}

/** Basic Information: update basic info (persists to backend). */
export async function updateBasicInfo(planId: string, entityId: string, payload: Record<string, unknown> = {}): Promise<unknown> {
  return apiPatch(
    '/api/svp/plans/' + encodeURIComponent(planId) + '/entities/' + encodeURIComponent(entityId) + '/basic-info',
    payload
  );
}
