'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

export type BrowserSupabaseClient = SupabaseClient<Database, any, any, any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasBrowserSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

let browserClient: BrowserSupabaseClient | null = null;

export function getBrowserSupabase(): BrowserSupabaseClient {
  if (!browserClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not configured.');
    }
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey) as unknown as BrowserSupabaseClient;
  }
  return browserClient;
}
