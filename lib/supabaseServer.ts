import { cookies } from 'next/headers';
import { createRouteHandlerClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

export function getServerComponentSupabase(): SupabaseClient<Database> {
  return createServerComponentClient<Database>({ cookies }) as unknown as SupabaseClient<Database>;
}

export function getRouteHandlerSupabase(): SupabaseClient<Database> {
  return createRouteHandlerClient<Database>({ cookies }) as unknown as SupabaseClient<Database>;
}

export async function getCurrentUser() {
  const supabase = getServerComponentSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}
