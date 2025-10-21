import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getSupabaseClient, hasSupabaseEnv } from '../lib/supabaseClient';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  hasSupabaseEnv,
  supabase: null
});

export function AuthProvider({ children, initialSession = null }) {
  const [session, setSession] = useState(initialSession);
  const [user, setUser] = useState(initialSession?.user ?? null);
  const [loading, setLoading] = useState(hasSupabaseEnv);
  const supabase = useMemo(() => getSupabaseClient(), []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      hasSupabaseEnv,
      supabase
    }),
    [user, session, loading, supabase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
