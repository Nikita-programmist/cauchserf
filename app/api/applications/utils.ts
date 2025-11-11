import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient, User } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

export type RouteClient = SupabaseClient<Database>;
export type ApplicationRow = Database['public']['Tables']['applications']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface ProfileSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  city: string | null;
  role: string | null;
}

export interface ApplicationsResponseItem extends ApplicationRow {
  host: ProfileSummary | null;
  guest: ProfileSummary | null;
}

export interface AuthenticatedRouteClient {
  supabase: RouteClient;
  user: User | null;
}

export async function getAuthClient(): Promise<AuthenticatedRouteClient> {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[applications] failed to resolve user', error);
  }
  return { supabase, user: data?.user ?? null };
}

export function parsePagination(searchParams: URLSearchParams) {
  const limit = (() => {
    const raw = Number(searchParams.get('limit'));
    if (!Number.isFinite(raw) || raw <= 0) return 20;
    return Math.min(50, Math.max(1, Math.trunc(raw)));
  })();

  const page = (() => {
    const raw = Number(searchParams.get('page'));
    if (!Number.isFinite(raw) || raw <= 0) return 1;
    return Math.max(1, Math.trunc(raw));
  })();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { limit, page, from, to };
}

export function mapProfile(profile: ProfileRow | undefined): ProfileSummary | null {
  if (!profile) return null;
  return {
    id: profile.id,
    first_name: profile.first_name ?? null,
    last_name: profile.last_name ?? null,
    avatar_url: profile.avatar_url ?? null,
    city: (profile as any).city ?? null,
    role: (profile as any).role ?? null,
  };
}

export async function enrichApplications(
  supabase: RouteClient,
  applications: ApplicationRow[]
): Promise<ApplicationsResponseItem[]> {
  if (applications.length === 0) {
    return [];
  }

  const profileIds = new Set<string>();
  for (const application of applications) {
    profileIds.add(application.host_id);
    profileIds.add(application.guest_id);
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, city, role')
    .in('id', Array.from(profileIds));

  if (profilesError) {
    console.error('[applications] failed to load profiles', profilesError);
  }

  const profilesMap = new Map<string, ProfileSummary>();
  for (const profile of profilesData ?? []) {
    const summary = mapProfile(profile as ProfileRow & Record<string, unknown>);
    if (summary) {
      profilesMap.set(summary.id, summary);
    }
  }

  return applications.map((application) => ({
    ...application,
    message: application.message ?? null,
    listing_id: application.listing_id ?? null,
    room_id: application.room_id ?? null,
    host: profilesMap.get(application.host_id) ?? null,
    guest: profilesMap.get(application.guest_id) ?? null,
  }));
}
