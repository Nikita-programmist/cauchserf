const TOKEN_KEY = 'cauchserf_jwt';
const REQUEST_TIMEOUT_MS = 40000;
const RETRY_COUNT = 1;

function readCookieToken() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie?.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function ensureApiPrefix(baseUrl: string | undefined) {
  const base = (baseUrl || '/api').replace(/\/$/, '');
  const hasApiSegment = /\/api(\/|$)/.test(base);
  if (hasApiSegment) return base;
  return `${base}/api`;
}

export function getApiBaseUrl() {
  const baseUrlWithPrefix = ensureApiPrefix(process.env.NEXT_PUBLIC_API_URL);
  return baseUrlWithPrefix.endsWith('/') ? baseUrlWithPrefix.slice(0, -1) : baseUrlWithPrefix;
}

function buildApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || readCookieToken();
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/;`;
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = buildApiUrl(path);
  const attempt = async () =>
    fetchWithTimeout(url, {
      ...options,
      headers,
      credentials: 'include'
    });

  let lastError: any = null;

  for (let attemptIndex = 0; attemptIndex <= RETRY_COUNT; attemptIndex += 1) {
    try {
      const res = await attempt();

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
      lastError = error;
      const isTimeout = error?.name === 'AbortError';
      if (!isTimeout || attemptIndex === RETRY_COUNT) {
        throw error;
      }
    }
  }

  throw lastError;
}

export const apiClient = {
  get: (path: string) => apiFetch(path, { method: 'GET' }),
  post: (path: string, body?: any) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path: string, body?: any) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) })
};

export { TOKEN_KEY };
