import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(url && key);

let client = null;
if (hasSupabaseEnv) {
  client = createClient(url, key);
}

export const supabase = client;
export const getSupabaseClient = () => client;
