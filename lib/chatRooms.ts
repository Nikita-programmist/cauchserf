// lib/chatRooms.ts
import { getServerSupabase } from '@/lib/supabaseServer';

export type ProfileSummary = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ChatRoomListItem = {
  roomId: string;
  otherUser: ProfileSummary;
  lastMessageText: string;
  lastMessageAt: string | null;
  unreadCount: number;
};

function normalizeProfile(fallbackId: string, raw: any): ProfileSummary {
  if (Array.isArray(raw) && raw[0]) {
    return {
      id: raw[0].id,
      display_name: raw[0].display_name ?? null,
      avatar_url: raw[0].avatar_url ?? null,
    };
  }
  if (raw) {
    return {
      id: raw.id,
      display_name: raw.display_name ?? null,
      avatar_url: raw.avatar_url ?? null,
    };
  }
  return {
    id: fallbackId,
    display_name: null,
    avatar_url: null,
  };
}

export async function getCurrentUserProfile() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: profile.id,
    display_name: profile.display_name ?? null,
    avatar_url: profile.avatar_url ?? null,
  } satisfies ProfileSummary;
}

/**
 * Гарантирует, что между currentUser и otherUser есть ROOM.
 * Если нашлась — вернуть её, если нет — создать.
 */
export async function ensureChatRoom(
  currentUserId: string,
  otherUserId: string
): Promise<{ id: string }> {
  const supabase = getServerSupabase();

  const { data: existing } = await supabase
    .from('chat_rooms')
    .select('id, traveler_id, host_id')
    .or(
      `and(traveler_id.eq.${currentUserId},host_id.eq.${otherUserId}),` +
        `and(traveler_id.eq.${otherUserId},host_id.eq.${currentUserId})`
    )
    .maybeSingle();

  if (existing) {
    return { id: existing.id as string };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('chat_rooms')
    .insert({
      traveler_id: currentUserId,
      host_id: otherUserId,
    })
    .select('id')
    .maybeSingle();

  if (insertErr || !inserted) {
    throw new Error(insertErr?.message ?? 'cannot create chat room');
  }

  return { id: inserted.id as string };
}

export async function getChatRoomWithProfiles(roomId: string) {
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('chat_rooms')
    .select(
      `
      id,
      traveler_id,
      host_id,
      created_at,
      traveler:profiles!chat_rooms_traveler_id_fkey(id, display_name, avatar_url),
      host:profiles!chat_rooms_host_id_fkey(id, display_name, avatar_url)
    `
    )
    .eq('id', roomId)
    .maybeSingle();

  if (error || !data) return null;

  const traveler = normalizeProfile(data.traveler_id as string, (data as any).traveler);
  const host = normalizeProfile(data.host_id as string, (data as any).host);

  return {
    id: data.id as string,
    traveler_id: traveler.id,
    host_id: host.id,
    traveler,
    host,
    created_at: data.created_at as string,
  };
}

export async function listUserChatRooms(userId: string): Promise<ChatRoomListItem[]> {
  const supabase = getServerSupabase();

  const { data: rooms, error } = await supabase
    .from('chat_rooms')
    .select(
      `
      id,
      traveler_id,
      host_id,
      created_at,
      traveler:profiles!chat_rooms_traveler_id_fkey(id, display_name, avatar_url),
      host:profiles!chat_rooms_host_id_fkey(id, display_name, avatar_url)
    `
    )
    .or(`traveler_id.eq.${userId},host_id.eq.${userId}`);

  if (error || !rooms) return [];

  const results: ChatRoomListItem[] = [];

  for (const room of rooms) {
    const traveler = normalizeProfile(room.traveler_id as string, (room as any).traveler);
    const host = normalizeProfile(room.host_id as string, (room as any).host);

    const iAmTraveler = traveler.id === userId;
    const otherUser = iAmTraveler ? host : traveler;

    const { data: lastMessages } = await supabase
      .from('chat_messages')
      .select('id, body, created_at')
      .eq('room_id', room.id as string)
      .order('created_at', { ascending: false })
      .limit(1);

    const last = lastMessages?.[0] ?? null;

    const { count: unreadCount } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id as string)
      .neq('sender_id', userId)
      .is('read_at', null);

    results.push({
      roomId: room.id as string,
      otherUser,
      lastMessageText: last?.body ?? '',
      lastMessageAt: last?.created_at ?? null,
      unreadCount: unreadCount ?? 0,
    });
  }

  results.sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0;
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return (
      new Date(b.lastMessageAt).getTime() -
      new Date(a.lastMessageAt).getTime()
    );
  });

  return results;
}
