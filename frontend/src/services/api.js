const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchDashboardSummary(params = {}) {
  const query = new URLSearchParams({
    horizon_days: params.horizon_days || 14,
    in_workers: params.in_workers || 15,
    out_workers: params.out_workers || 14,
    in_rate: params.in_rate || 105.0,
    out_rate: params.out_rate || 110.0,
    shift_hours: params.shift_hours || 8.0
  }).toString();

  const res = await fetch(`${API_BASE}/api/dashboard/summary?${query}`);
  if (!res.ok) {
    throw new Error(`Failed to load dashboard summary: ${res.statusText}`);
  }
  return await res.json();
}

export async function runForecast(operation, horizonDays = 14) {
  const res = await fetch(`${API_BASE}/api/forecast/${operation}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ horizon_days: horizonDays, test_split_days: 14 })
  });
  if (!res.ok) {
    throw new Error(`Forecast request failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function calculateWorkforce(params) {
  const res = await fetch(`${API_BASE}/api/workforce/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error(`Workforce calculation failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function runOptimization(params) {
  const res = await fetch(`${API_BASE}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error(`Optimization failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function runWhatIfScenario(scenarioParams) {
  const res = await fetch(`${API_BASE}/api/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenarioParams)
  });
  if (!res.ok) {
    throw new Error(`Scenario simulation failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function analyzeSubProcesses(params) {
  const res = await fetch(`${API_BASE}/api/subprocesses/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error(`Subprocess analysis failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function uploadDatasetFile(datasetType, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/api/upload/${datasetType}`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
  }
  return await res.json();
}

export async function getDatasetStats() {
  const res = await fetch(`${API_BASE}/api/demo-data/stats`);
  if (!res.ok) throw new Error('Failed to fetch dataset stats');
  return await res.json();
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
