import { getServerSupabase } from '@/lib/supabaseServer';

export type ProfileSummary = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ChatRoomRow = {
  id: string;
  traveler_id: string;
  host_id: string;
  created_at: string;
};

export async function getCurrentUserProfile() {
  const supabase = getServerSupabase();
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    return {
      id: authData.user.id,
      display_name: authData.user.user_metadata?.full_name ?? null,
      avatar_url: authData.user.user_metadata?.avatar_url ?? null,
    } as ProfileSummary;
  }

  return profile as ProfileSummary;
}

export async function ensureChatRoom(
  travelerId: string,
  hostId: string
): Promise<ChatRoomRow> {
  const supabase = getServerSupabase();

  const { data: existingRoom, error: existingError } = await supabase
    .from('chat_rooms')
    .select('id, traveler_id, host_id, created_at')
    .or(
      `and(traveler_id.eq.${travelerId},host_id.eq.${hostId}),and(traveler_id.eq.${hostId},host_id.eq.${travelerId})`
    )
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingRoom) {
    return existingRoom as ChatRoomRow;
  }

  const { data: createdRoom, error: createError } = await supabase
    .from('chat_rooms')
    .insert({ traveler_id: travelerId, host_id: hostId })
    .select('id, traveler_id, host_id, created_at')
    .single();

  if (createError || !createdRoom) {
    throw createError ?? new Error('Failed to create chat room');
  }

  return createdRoom as ChatRoomRow;
}

export async function getChatRoomWithProfiles(roomId: string) {
  const supabase = getServerSupabase();

  const { data: room, error } = await supabase
    .from('chat_rooms')
    .select(
      `id, traveler_id, host_id, created_at,
      traveler:profiles!chat_rooms_traveler_id_fkey(id, display_name, avatar_url),
      host:profiles!chat_rooms_host_id_fkey(id, display_name, avatar_url)`
    )
    .eq('id', roomId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!room) {
    return null;
  }

  const rawTraveler = (room as any).traveler;
  const rawHost = (room as any).host;

  const traveler: ProfileSummary = Array.isArray(rawTraveler)
    ? rawTraveler[0] ?? {
        id: room.traveler_id as string,
        display_name: null,
        avatar_url: null,
      }
    : rawTraveler ?? {
        id: room.traveler_id as string,
        display_name: null,
        avatar_url: null,
      };

  const host: ProfileSummary = Array.isArray(rawHost)
    ? rawHost[0] ?? {
        id: room.host_id as string,
        display_name: null,
        avatar_url: null,
      }
    : rawHost ?? {
        id: room.host_id as string,
        display_name: null,
        avatar_url: null,
      };

  return {
    id: room.id,
    traveler_id: room.traveler_id,
    host_id: room.host_id,
    created_at: room.created_at,
    traveler,
    host,
  };
}
