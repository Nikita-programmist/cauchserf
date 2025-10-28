import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

let serviceClient: SupabaseClient | null = null;

function assertEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getServerSupabase(): SupabaseClient {
  if (serviceClient) {
    return serviceClient;
  }

  const supabaseUrl = assertEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = assertEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);

  serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return serviceClient;
}

export type CurrentUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
};

export async function getCurrentUser(req: NextRequest): Promise<CurrentUser | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (error) {
        return null;
      }
      const user = data.user;
      if (!user) {
        return null;
      }
      return {
        id: user.id,
        email: user.email,
        name: (user.user_metadata?.full_name as string | undefined) ?? null,
        avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null
      };
    }
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: (user.user_metadata?.full_name as string | undefined) ?? null,
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null
  };
}
