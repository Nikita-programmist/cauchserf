import { apiClient, clearToken, setToken } from './apiClient';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
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
  return apiClient.get('/users/me');
}
