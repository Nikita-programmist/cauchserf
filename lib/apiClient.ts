const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = 'cauchserf_jwt';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path: string, options: RequestInit = {}) {
  if (!API_BASE_URL) {
    const message =
      'NEXT_PUBLIC_API_URL is not set. Please configure the backend URL in your environment.';
    console.warn(message);
    throw new Error(message);
  }

  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const responseText = await res.text();
    let parsedBody: any = null;
    try {
      parsedBody = responseText ? JSON.parse(responseText) : null;
    } catch (err) {
      parsedBody = null;
    }

    const errorMessage =
      (parsedBody && typeof parsedBody === 'object' && parsedBody.message) ||
      responseText ||
      'Request failed';

    const error = new Error(typeof errorMessage === 'string' ? errorMessage : 'Request failed');
    (error as any).status = res.status;
    (error as any).body = parsedBody ?? responseText;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const apiClient = {
  get: (path: string) => request(path, { method: 'GET' }),
  post: (path: string, body?: any) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path: string, body?: any) => request(path, { method: 'PATCH', body: JSON.stringify(body) })
};
