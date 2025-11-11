import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import { anon, admin } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export const getServerSupabase = anon;
export const getServiceSupabase = admin;

export async function getCurrentUser() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}
