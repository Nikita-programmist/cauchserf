const TOKEN_KEY = 'cauchserf_jwt';
const REQUEST_TIMEOUT_MS = 15000;

export function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('API_URL не настроен. Укажите NEXT_PUBLIC_API_URL в переменных окружения.');
  }
  return baseUrl;
}

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
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal
    });

    if (!res.ok) {
      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const parsedBody = isJson ? await res.json().catch(() => null) : null;
      const responseText = !parsedBody ? await res.text().catch(() => '') : '';

      const messageFromBody =
        typeof parsedBody?.message === 'string'
          ? parsedBody.message
          : Array.isArray(parsedBody?.message)
            ? parsedBody?.message?.join(', ')
            : typeof parsedBody?.error === 'string'
              ? parsedBody.error
              : null;

      const errorMessage = messageFromBody || responseText || 'Request failed';
      const error = new Error(errorMessage);
      (error as any).status = res.status;
      (error as any).body = parsedBody ?? responseText;
      throw error;
    }

    if (res.status === 204) return null;
    return res.json();
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Превышено время ожидания ответа от сервера. Попробуйте ещё раз.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: (path: string) => request(path, { method: 'GET' }),
  post: (path: string, body?: any) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path: string, body?: any) => request(path, { method: 'PATCH', body: JSON.stringify(body) })
};
