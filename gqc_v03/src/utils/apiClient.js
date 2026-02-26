/**
 * Smart Rollout API Client
 *
 * Base URL configured via VITE_API_URL environment variable.
 * All methods return promises; errors throw with message.
 * Automatically injects Cognito ID token for authenticated requests.
 */

import { getCurrentSession, signOut } from './auth';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inject Cognito auth token
  const session = await getCurrentSession();
  if (session?.idToken) {
    headers['Authorization'] = session.idToken;
  }

  // Idempotency header for POST requests
  if (options.method === 'POST' && !headers['X-Client-Request-Id']) {
    headers['X-Client-Request-Id'] = crypto.randomUUID();
  }

  const res = await fetch(url, { ...options, headers });

  // Handle 401 — force re-login
  if (res.status === 401) {
    signOut();
    window.location.reload();
    throw new Error('Session expired. Please sign in again.');
  }

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || body.message || `API error ${res.status}`);
  }

  return body;
}

// ── Programs ──

export function createProgram(data) {
  return request('/programs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function listPrograms(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/programs${qs}`);
}

export function getProgram(programId) {
  return request(`/programs/${programId}`);
}

// ── Flow Generation ──

export function generateFlow(programId, flowDefinition) {
  return request(`/programs/${programId}/generate-flow`, {
    method: 'POST',
    body: JSON.stringify({ flowDefinition }),
  });
}

// ── Execution (legacy — direct Step Functions trigger) ──

export function executeFlow(programId) {
  return request(`/programs/${programId}/execute`, {
    method: 'POST',
  });
}

export function getExecution(programId, executionId) {
  return request(`/programs/${programId}/executions/${executionId}`);
}

export function listExecutions(programId, limit = 25) {
  return request(`/programs/${programId}/executions?limit=${limit}`);
}

// ── Execution System (new — scenario-driven with rolloutInstanceId) ──

/**
 * Start a new execution run with scenario parameters.
 * @param {{ programId: string, scenarioParams: object }} params
 * @returns {{ rolloutInstanceId, status, s3Prefix, scenarioParams, startedAt }}
 */
export function startExecution(params) {
  return request('/executions/start', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get execution status by rolloutInstanceId.
 * @param {string} rolloutInstanceId
 * @returns {{ rolloutInstanceId, status, stepsCompleted, stepsTotal, s3Prefix, datasetsWritten, ... }}
 */
export function getExecutionStatus(rolloutInstanceId) {
  return request(`/executions/${rolloutInstanceId}/status`);
}

// ── Templates ──

export function saveTemplate(template) {
  return request('/templates', {
    method: 'POST',
    body: JSON.stringify(template),
  });
}

export function listTemplates() {
  return request('/templates');
}

// ── Step Configuration ──

export function listAllStepConfigs(programId) {
  return request(`/programs/${programId}/step-configs`);
}

export function getStepConfig(programId, phaseId, stepId) {
  return request(`/programs/${programId}/steps/${phaseId}/${stepId}/config`);
}

export function saveStepConfig(programId, phaseId, stepId, config) {
  return request(`/programs/${programId}/steps/${phaseId}/${stepId}/config`, {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

export function deleteStepConfig(programId, phaseId, stepId) {
  return request(`/programs/${programId}/steps/${phaseId}/${stepId}/config`, {
    method: 'DELETE',
  });
}

export function listStepConfigVersions(programId, phaseId, stepId) {
  return request(`/programs/${programId}/steps/${phaseId}/${stepId}/config/versions`);
}

export function rollbackStepConfig(programId, phaseId, stepId, version) {
  return request(`/programs/${programId}/steps/${phaseId}/${stepId}/config/rollback/${version}`, {
    method: 'POST',
  });
}

export function submitStepForm(programId, phaseId, stepId, data) {
  return request(`/programs/${programId}/steps/${phaseId}/${stepId}/submissions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function testExternalApi(programId, phaseId, stepId) {
  return request(`/programs/${programId}/steps/${phaseId}/${stepId}/test-api`, {
    method: 'POST',
  });
}

// ── Utility ──

export function isConfigured() {
  return !!BASE_URL;
}

export default {
  createProgram,
  listPrograms,
  getProgram,
  generateFlow,
  executeFlow,
  getExecution,
  listExecutions,
  startExecution,
  getExecutionStatus,
  saveTemplate,
  listTemplates,
  listAllStepConfigs,
  getStepConfig,
  saveStepConfig,
  deleteStepConfig,
  listStepConfigVersions,
  rollbackStepConfig,
  submitStepForm,
  testExternalApi,
  isConfigured,
};
