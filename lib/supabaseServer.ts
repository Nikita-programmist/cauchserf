import { anon, admin } from '@/lib/supabase/server';

export const getServerSupabase = anon;
export const getServiceSupabase = admin;

export async function getCurrentUser() {
  const supabase = anon();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}
