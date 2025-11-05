// lib/chatRooms.ts
import { admin } from '@/lib/supabase/server';

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

/**
 * ВАЖНО: нужен для /app/api/chat/room/route.ts
 */
export async function ensureChatRoom(
  currentUserId: string,
  otherUserId: string
): Promise<{ id: string }> {
  const client = admin();

  const { data: existing } = await client
    .from('chat_rooms')
    .select('id, traveler_id, host_id')
    .or(
      `and(traveler_id.eq.${currentUserId},host_id.eq.${otherUserId}),` +
        `and(traveler_id.eq.${otherUserId},host_id.eq.${currentUserId})`
    )
    .maybeSingle<{ id: string | null }>();

  if (existing?.id) {
    return { id: existing.id };
  }

  const { data: inserted, error: insertErr } = await client
    .from('chat_rooms')
    .insert({
      traveler_id: currentUserId,
      host_id: otherUserId,
    } as never)
    .select('id')
    .maybeSingle<{ id: string | null }>();

  if (insertErr || !inserted?.id) {
    throw new Error(insertErr?.message ?? 'cannot create chat room');
  }

  return { id: inserted.id };
}

export async function getChatRoomWithProfiles(roomId: string) {
  const client = admin();

  const { data, error } = await client
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
    .maybeSingle<Record<string, any>>();

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
  const client = admin();

  const { data: rooms, error } = await client
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

  const records = rooms as Array<Record<string, any>>;
  const results: ChatRoomListItem[] = [];

  for (const room of records) {
    const traveler = normalizeProfile(room.traveler_id as string, room.traveler);
    const host = normalizeProfile(room.host_id as string, room.host);

    const iAmTraveler = traveler.id === userId;
    const otherUser = iAmTraveler ? host : traveler;

    const { data: lastMessages } = await client
      .from('chat_messages')
      .select('id, body, created_at')
      .eq('room_id', room.id as string)
      .order('created_at', { ascending: false })
      .limit(1);

    const last = (lastMessages?.[0] ?? null) as Record<string, any> | null;
    const lastMessageText =
      typeof last?.body === 'string' ? last.body : '';
    const lastMessageAt =
      typeof last?.created_at === 'string' ? last.created_at : null;

    const { count: unreadCount } = await client
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id as string)
      .neq('sender_id', userId)
      .is('read_at', null);

    results.push({
      roomId: room.id as string,
      otherUser,
      lastMessageText,
      lastMessageAt,
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

