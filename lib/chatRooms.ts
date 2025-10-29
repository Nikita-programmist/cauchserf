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

export type ChatRoomListItem = {
  roomId: string;
  otherUser: ProfileSummary;
  lastMessageText: string;
  lastMessageAt: string | null;
  unreadCount: number;
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

export async function listUserChatRooms(userId: string): Promise<ChatRoomListItem[]> {
  const supabase = getServerSupabase();

  const { data: rooms, error } = await supabase
    .from('chat_rooms')
    .select(
      `id, traveler_id, host_id, created_at,
      traveler:profiles!chat_rooms_traveler_id_fkey(id, display_name, avatar_url),
      host:profiles!chat_rooms_host_id_fkey(id, display_name, avatar_url)`
    )
    .or(`traveler_id.eq.${userId},host_id.eq.${userId}`);

  if (error) {
    throw error;
  }

  if (!rooms || rooms.length === 0) {
    return [];
  }

  const summaries = await Promise.all(
    rooms.map(async (room) => {
      const roomId = room.id as string;
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

      const otherUser = userId === traveler.id ? host : traveler;

      const { data: lastMessages, error: lastMessageError } = await supabase
        .from('chat_messages')
        .select('id, body, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastMessageError) {
        throw lastMessageError;
      }

      const lastMessage = lastMessages?.[0] ?? null;

      const { count: unreadCount, error: unreadError } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (unreadError) {
        throw unreadError;
      }

      return {
        roomId,
        otherUser,
        lastMessageText: lastMessage?.body ?? '',
        lastMessageAt: lastMessage?.created_at ?? null,
        unreadCount: unreadCount ?? 0,
      } satisfies ChatRoomListItem;
    })
  );

  return summaries.sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0;
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });
}
