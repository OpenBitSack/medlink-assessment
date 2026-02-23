const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  createSession: (patientId: string, forceNew = false) =>
    request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId, force_new: forceNew }),
    }),

  getSession: (sessionId: string) =>
    request<any>(`/sessions/${sessionId}`),

  startSession: (sessionId: string) =>
    request<any>(`/sessions/${sessionId}/start`, { method: 'POST' }),

  interruptSession: (sessionId: string) =>
    request<any>(`/sessions/${sessionId}/interrupt`, { method: 'POST' }),

  resumeSession: (sessionId: string) =>
    request<any>(`/sessions/${sessionId}/resume`, { method: 'POST' }),

  completeSession: (sessionId: string) =>
    request<any>(`/sessions/${sessionId}/complete`, { method: 'POST' }),

  heartbeat: (sessionId: string) =>
    request<any>(`/sessions/${sessionId}/heartbeat`, { method: 'POST' }),

  checkRecovery: (sessionId: string) =>
    request<any>(`/sessions/${sessionId}/recovery`),

  getTranscript: (sessionId: string) =>
    request<any>(`/transcripts/${sessionId}`),

  getStitchedTranscript: (sessionId: string) =>
    request<any>(`/transcripts/${sessionId}/stitched`),

  getQueueStatus: () =>
    request<any>('/queue/status'),

  getQueuePosition: (sessionId: string) =>
    request<any>(`/queue/position/${sessionId}`),
};
