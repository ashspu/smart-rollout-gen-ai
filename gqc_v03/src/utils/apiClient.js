/**
 * Smart Rollout API Client
 *
 * Base URL configured via VITE_API_URL environment variable.
 * All methods return promises; errors throw with message.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Idempotency header for POST requests
  if (options.method === 'POST' && !headers['X-Client-Request-Id']) {
    headers['X-Client-Request-Id'] = crypto.randomUUID();
  }

  const res = await fetch(url, { ...options, headers });
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

// ── Flow Generation ──

export function generateFlow(programId, flowDefinition) {
  return request(`/programs/${programId}/generate-flow`, {
    method: 'POST',
    body: JSON.stringify({ flowDefinition }),
  });
}

// ── Execution ──

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

// ── Utility ──

export function isConfigured() {
  return !!BASE_URL;
}

export default {
  createProgram,
  listPrograms,
  generateFlow,
  executeFlow,
  getExecution,
  listExecutions,
  saveTemplate,
  listTemplates,
  isConfigured,
};
