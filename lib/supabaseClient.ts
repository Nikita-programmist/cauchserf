'use client';

import type { BrowserSupabaseClient } from '@/lib/supabaseBrowser';
import { getBrowserSupabase, hasBrowserSupabaseEnv } from '@/lib/supabaseBrowser';

export { getBrowserSupabase } from '@/lib/supabaseBrowser';
export const hasSupabaseEnv = hasBrowserSupabaseEnv;

let cachedClient: BrowserSupabaseClient | null = null;

export function getSupabaseClient(): BrowserSupabaseClient | null {
  if (!cachedClient && hasSupabaseEnv) {
    cachedClient = getBrowserSupabase();
  }
  return cachedClient;
}

export const supabase: BrowserSupabaseClient = getBrowserSupabase();
