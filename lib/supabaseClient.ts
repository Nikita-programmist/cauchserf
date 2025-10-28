import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!hasSupabaseEnv) {
    return null;
  }
  const url = supabaseUrl as string;
  const key = supabaseAnonKey as string;
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return client;
}

export function createSupabaseClient(): SupabaseClient | null {
  if (!hasSupabaseEnv) {
    return null;
  }
  const url = supabaseUrl as string;
  const key = supabaseAnonKey as string;
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export function getBrowserSupabaseClient(): SupabaseClient | null {
  return getSupabaseClient();
}
