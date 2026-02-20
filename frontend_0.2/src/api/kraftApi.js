/// <reference types="vite/client" />
// Backend runs on 8000; avoid using frontend origin (5173) by mistake
const _env = import.meta.env.VITE_API_BASE_URL || '';
const BASE = _env && !_env.includes('5173') ? _env : 'http://localhost:8000';

export const kraftApi = {
  async allocate(options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const res = await fetch(`${BASE}/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_ids: options.taskIds ?? null,
        team_member_ids: options.teamMemberIds ?? null,
        apply: options.apply ?? false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Allocation failed: ${res.status}`);
    }
    return res.json();
  },

  async health() {
    const res = await fetch(`${BASE}/health`);
    return res.json();
  },

  async preAllocationStats() {
    const res = await fetch(`${BASE}/stats/pre_allocation`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Stats fetch failed: ${res.status}`);
    }
    return res.json();
  },

  async explainTask(payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const res = await fetch(`${BASE}/allocate/explain_task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Explain task failed: ${res.status}`);
    }
    return res.json();
  },
};
