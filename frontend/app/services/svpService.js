/**
 * Service for Site Visit Plan (SVP) page data.
 */
import { apiGet, apiPost, apiPatch, apiPostMultipart, apiDelete } from './api';

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

/** Coversheet: plan data (including plan_description) comes from getPlanById.
 * payload: { planName?: string, planDescription?: string, action?: 'save' | 'save_and_continue' | 'mark_complete' }
 * Returns full response (may include nextUrl). */
export async function updateCoversheet(planId, payload = {}) {
  const planName = payload.planName != null ? String(payload.planName) : '';
  const planDescription = payload.planDescription != null ? String(payload.planDescription) : '';
  const action = payload.action || undefined;
  const body = {
    planName,
    planDescription,
  };
  if (action) body.action = action;
  console.log('[svpService.updateCoversheet] received:', { planId, payload: { ...payload, planDescription: (payload.planDescription ?? '').slice(0, 80) + ((payload.planDescription ?? '').length > 80 ? '...' : '') } });
  console.log('[svpService.updateCoversheet] sending body:', { planName: body.planName, planDescription: body.planDescription?.slice(0, 80) + (body.planDescription?.length > 80 ? '...' : ''), action: body.action });
  return apiPatch('/api/svp/plans/' + encodeURIComponent(planId) + '/coversheet', body);
}

export async function getCoversheetAttachments(planId) {
  const data = await apiGet(
    '/api/svp/plans/' + encodeURIComponent(planId) + '/coversheet/attachments'
  );
  return data.attachments ?? [];
}

export async function uploadCoversheetAttachment(planId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiPostMultipart(
    '/api/svp/plans/' + encodeURIComponent(planId) + '/coversheet/attachments',
    formData
  );
}

export async function deleteCoversheetAttachment(planId, storedName) {
  return apiDelete(
    '/api/svp/plans/' +
      encodeURIComponent(planId) +
      '/coversheet/attachments/' +
      encodeURIComponent(storedName)
  );
}

export async function getPlanEntities(planId) {
  const data = await apiGet('/api/svp/plans/' + encodeURIComponent(planId) + '/entities');
  return data.entities ?? [];
}

export async function getAvailableEntities(planId, searchParams = {}) {
  const params = new URLSearchParams();
  if (searchParams.entity_number) params.append('entity_number', searchParams.entity_number);
  if (searchParams.entity_name) params.append('entity_name', searchParams.entity_name);
  if (searchParams.city) params.append('city', searchParams.city);
  if (searchParams.state) params.append('state', searchParams.state);
  const queryString = params.toString();
  const url = '/api/svp/plans/' + encodeURIComponent(planId) + '/entities/available' + (queryString ? '?' + queryString : '');
  const data = await apiGet(url);
  return data.entities ?? [];
}

export async function addEntityToPlan(planId, entityId) {
  return apiPost('/api/svp/plans/' + encodeURIComponent(planId) + '/entities', { entityId });
}

export async function removeEntityFromPlan(planId, entityId) {
  return apiDelete('/api/svp/plans/' + encodeURIComponent(planId) + '/entities/' + encodeURIComponent(entityId));
}

export async function updateEntityStatus(planId, entityId, status) {
  return apiPatch('/api/svp/plans/' + encodeURIComponent(planId) + '/entities/' + encodeURIComponent(entityId), { status });
}

/** Update a plan section's status (e.g. selected_entities, cover_sheet). */
export async function updatePlanSectionStatus(planId, sectionId, status) {
  return apiPatch(
    '/api/svp/plans/' + encodeURIComponent(planId) + '/sections/' + encodeURIComponent(sectionId),
    { status }
  );
}
