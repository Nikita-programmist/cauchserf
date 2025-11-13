export const runtime = 'nodejs';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set.');
}

export function getAdminSupabase(): SupabaseClient<Database, 'public'> {
  return createClient<Database, 'public'>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
