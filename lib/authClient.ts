import { apiClient, clearToken, setToken } from './apiClient';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
  hostProfile?: any;
  guestProfile?: any;
}

export async function register(email: string, password: string, name?: string) {
  const result = await apiClient.post('/auth/register', { email, password, name });
  if (result?.token) setToken(result.token);
  return result;
}

export async function login(email: string, password: string) {
  const result = await apiClient.post('/auth/login', { email, password });
  if (result?.token) setToken(result.token);
  return result;
}

export async function logout() {
  clearToken();
}

export async function getCurrentUser() {
  return apiClient.get('/api/me');
}

export async function completeOnboarding(role: 'GUEST' | 'HOST') {
  return apiClient.post('/api/me/onboarding', { role });
}

export async function updateProfile(payload: { name?: string; bio?: string; city?: string; country?: string; avatarUrl?: string }) {
  return apiClient.patch('/api/me', payload);
}
