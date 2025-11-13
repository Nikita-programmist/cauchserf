import type { SupabaseClient } from '@supabase/supabase-js';

import { getAdminSupabase } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/supabase/types';

type TypedSupabase = SupabaseClient<Database, any, any, any>;
type RoomRole = Database['public']['Enums']['room_role'];
type RoomMemberInsert = Database['public']['Tables']['room_members']['Insert'];

export type RoomMemberProfile = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

export type RoomListItem = {
  id: string;
  roomId: string;
  role: RoomRole;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  peers: RoomMemberProfile[];
};

function resolveProfileName(
  profile: Pick<
    Database['public']['Tables']['profiles']['Row'],
    'full_name' | 'first_name' | 'last_name' | 'name'
  > | null,
  fallback: string
): string {
  if (!profile) return fallback;

  const { full_name: fullName, first_name: firstName, last_name: lastName, name } = profile;

  if (fullName && fullName.trim()) return fullName.trim();

  const combined = [firstName, lastName]
    .filter((part) => part && part.trim().length > 0)
    .join(' ')
    .trim();

  if (combined) return combined;

  if (name && name.trim()) return name.trim();

  return fallback;
}

async function ensureRoomExists(
  supabase: TypedSupabase,
  existingRoomId: string | null
): Promise<string> {
  if (existingRoomId) {
    return existingRoomId;
  }

  const { data, error } = await supabase.from('rooms').insert({}).select('id').single();

  if (error || !data) {
    throw error ?? new Error('failed_to_create_room');
  }

  return data.id;
}

async function upsertMembers(
  supabase: TypedSupabase,
  members: RoomMemberInsert[]
): Promise<void> {
  if (members.length === 0) return;

  const { error } = await supabase
    .from('room_members')
    .upsert(members satisfies RoomMemberInsert[], { onConflict: 'room_id,user_id' });

  if (error) {
    throw error;
  }
}

export async function ensureRoomForApplication(
  supabase: TypedSupabase,
  applicationId: string
): Promise<{ roomId: string; guestId: string; hostId: string } | null> {
  const { data: application, error } = await supabase
    .from('applications')
    .select('id, guest_id, host_id, room_id')
    .eq('id', applicationId)
    .maybeSingle();

  if (error || !application) {
    return null;
  }

  const admin = getAdminSupabase();
  const roomId = await ensureRoomExists(admin, application.room_id);

  if (roomId !== application.room_id) {
    await admin.from('applications').update({ room_id: roomId }).eq('id', application.id);
  }

  const members: RoomMemberInsert[] = [
    { room_id: roomId, user_id: application.guest_id, role: 'guest' },
    { room_id: roomId, user_id: application.host_id, role: 'host' },
  ];

  await upsertMembers(admin, members);

  return { roomId, guestId: application.guest_id, hostId: application.host_id };
}

export async function listRoomsForUser(
  supabase: TypedSupabase,
  userId: string
): Promise<RoomListItem[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('room_members')
    .select('room_id, role')
    .eq('user_id', userId)
    .order('room_id');

  if (membershipError) {
    throw membershipError;
  }

  if (!memberships?.length) {
    return [];
  }

  const roomIds = memberships.map((item) => item.room_id);

  const { data: rawPeers, error: peersError } = await supabase
    .from('room_members')
    .select('room_id, user_id')
    .in('room_id', roomIds)
    .neq('user_id', userId);

  if (peersError) {
    throw peersError;
  }

  const peerIds = Array.from(new Set((rawPeers ?? []).map((item) => item.user_id)));

  const { data: profiles, error: profilesError } = peerIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, name, avatar_url')
        .in('id', peerIds)
    : { data: [], error: null };

  if (profilesError) {
    throw profilesError;
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile] as const)
  );

  const lastMessageMap = new Map<string, { content: string | null; created_at: string }>();

  await Promise.all(
    roomIds.map(async (roomId) => {
      const { data: latest, error: latestError } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestError) {
        throw latestError;
      }

      const message = latest?.[0] ?? null;
      if (message) {
        lastMessageMap.set(roomId, {
          content: message.content ?? null,
          created_at: message.created_at,
        });
      }
    })
  );

  const items = memberships.map((membership) => {
    const peers = (rawPeers ?? [])
      .filter((peer) => peer.room_id === membership.room_id)
      .map((peer) => {
        const profile = profileMap.get(peer.user_id) ?? null;
        return {
          id: peer.user_id,
          name: resolveProfileName(profile, 'Участник чата'),
          avatarUrl: profile?.avatar_url ?? null,
        } satisfies RoomMemberProfile;
      });

    const lastMessage = lastMessageMap.get(membership.room_id) ?? null;

    return {
      id: membership.room_id,
      roomId: membership.room_id,
      role: membership.role as RoomRole,
      peers,
      lastMessageText: lastMessage?.content ?? null,
      lastMessageAt: lastMessage?.created_at ?? null,
    } satisfies RoomListItem;
  });

  items.sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0;
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  return items;
}

export async function ensureRoomForStayRequest(
  supabase: TypedSupabase,
  requestId: string
): Promise<{ roomId: string; travelerId: string; hostId: string } | null> {
  const { data: request, error } = await supabase
    .from('stay_requests')
    .select('id, traveler_id, host_id, room_id')
    .eq('id', requestId)
    .maybeSingle();

  if (error || !request) {
    return null;
  }

  const roomId = await ensureRoomExists(supabase, request.room_id);

  if (roomId !== request.room_id) {
    await supabase.from('stay_requests').update({ room_id: roomId }).eq('id', request.id);
  }

  const members: RoomMemberInsert[] = [
    { room_id: roomId, user_id: request.traveler_id, role: 'traveler' },
    { room_id: roomId, user_id: request.host_id, role: 'host' },
  ];

  await upsertMembers(supabase, members);

  return { roomId, travelerId: request.traveler_id, hostId: request.host_id };
}

export async function ensureRoomForUsers(
  supabase: TypedSupabase,
  userA: string,
  userB: string
): Promise<string> {
  if (userA === userB) {
    throw new Error('cannot create room for the same user');
  }

  const { data: ownMemberships, error: membershipError } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('user_id', userA);

  if (membershipError) {
    throw membershipError;
  }

  const candidateRoomIds = ownMemberships?.map((item) => item.room_id) ?? [];

  if (candidateRoomIds.length) {
    const { data: sharedMembership, error: sharedError } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', userB)
      .in('room_id', candidateRoomIds)
      .limit(1);

    if (sharedError) {
      throw sharedError;
    }

    const sharedRoom = sharedMembership?.[0]?.room_id;
    if (sharedRoom) {
      return sharedRoom;
    }
  }

  const roomId = await ensureRoomExists(supabase, null);

  const members: RoomMemberInsert[] = [
    { room_id: roomId, user_id: userA, role: 'member' },
    { room_id: roomId, user_id: userB, role: 'member' },
  ];

  await upsertMembers(supabase, members);

  return roomId;
}
