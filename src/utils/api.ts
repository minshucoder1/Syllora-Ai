/**
 * API Fetch Client with Automatic Session Bearer Token Injection
 */

export function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('syllora_session_token') ||
    localStorage.getItem('studyai_session_token') ||
    null
  );
}

export function getAuthHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  const token = getStoredSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getStoredSessionToken();
  const headers = new Headers(init?.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
