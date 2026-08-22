import { LearningNode, NodeEdge, RoutingDecision, TelemetrySignal, UserNodeState } from '../types';

const API_BASE = '/api/v1';

export async function fetchGraph(): Promise<{ nodes: LearningNode[]; edges: NodeEdge[] }> {
  const res = await fetch(`${API_BASE}/routing/graph`);
  if (!res.ok) throw new Error('Failed to fetch graph');
  return res.json();
}

export async function fetchUserState(): Promise<{ states: UserNodeState[] }> {
  const res = await fetch(`${API_BASE}/routing/user-state`, {
    credentials: 'include',
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    throw new Error('Failed to fetch user state');
  }
  return res.json();
}

export async function fetchDynamicNodeContent(nodeId: string, userId?: string) {
  const url = userId
    ? `${API_BASE}/routing/nodes/${nodeId}/content?userId=${encodeURIComponent(userId)}`
    : `${API_BASE}/routing/nodes/${nodeId}/content`;

  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch dynamic content');
  return res.json();
}

export async function sendTelemetry(signal: TelemetrySignal): Promise<{ status: string; eventId: string; executionTimeMs: number }> {
  const res = await fetch(`${API_BASE}/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(signal),
  });
  if (!res.ok) throw new Error('Failed to send telemetry');
  return res.json();
}

export async function evaluateRouting(nodeId: string, signal?: TelemetrySignal): Promise<{ decision: RoutingDecision }> {
  const res = await fetch(`${API_BASE}/routing/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nodeId, signal }),
  });
  if (!res.ok) throw new Error('Failed to evaluate routing');
  return res.json();
}

export async function loginWithGoogle(idToken: string) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google authentication failed');
  return data;
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerUser(email: string, password: string, name?: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function logoutUser() {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}
