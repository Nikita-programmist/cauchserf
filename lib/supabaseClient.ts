'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

type BrowserSupabaseClient = SupabaseClient<any, any, any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

let browserClient: BrowserSupabaseClient | null = null;

export function getBrowserSupabase(): BrowserSupabaseClient {
  if (!browserClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      browserClient = new Proxy({} as BrowserSupabaseClient, {
        get() {
          throw new Error('Supabase environment variables are not configured.');
        },
      });
    } else {
      browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return browserClient;
}

export function getSupabaseClient(): BrowserSupabaseClient | null {
  return hasSupabaseEnv ? getBrowserSupabase() : null;
}

// старые страницы ожидают { supabase }
export const supabase: BrowserSupabaseClient = getBrowserSupabase();
