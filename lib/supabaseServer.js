import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

import { hasSupabaseEnv } from './supabaseClient';

export function getServerSupabaseClient(ctx) {
  if (!hasSupabaseEnv) {
    return null;
  }

  const { req, res } = ctx;

  return createPagesServerClient({
    req,
    res,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
}
