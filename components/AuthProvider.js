'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser } from '../lib/authClient';
import { getToken, setToken, clearToken } from '../lib/apiClient';

const AuthContext = createContext({
  user: null,
  loading: true,
  token: null,
  login: async (_email, _password) => {},
  register: async (_email, _password, _name) => {},
  logout: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setLocalToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = getToken();
    if (!existing) {
      setLoading(false);
      return;
    }
    setLocalToken(existing);
    getCurrentUser()
      .then((profile) => setUser(profile))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const result = await apiLogin(email, password);
    if (result?.token) {
      setToken(result.token);
      setLocalToken(result.token);
      setUser(result.user);
    }
    return result;
  };

  const register = async (email, password, name) => {
    const result = await apiRegister(email, password, name);
    if (result?.token) {
      setToken(result.token);
      setLocalToken(result.token);
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await apiLogout();
    clearToken();
    setUser(null);
    setLocalToken(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
