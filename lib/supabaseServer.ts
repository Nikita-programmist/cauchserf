import { cookies } from 'next/headers';
import { createRouteHandlerClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/supabase/types';

export function getServerComponentSupabase() {
  return createServerComponentClient<Database>({ cookies });
}

export function getRouteHandlerSupabase() {
  return createRouteHandlerClient<Database>({ cookies });
}

export async function getCurrentUser() {
  const supabase = getServerComponentSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}
