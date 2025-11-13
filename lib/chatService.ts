import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

type RoomMemberInsert = Database['public']['Tables']['room_members'] extends { Insert: infer I }
  ? I
  : never;

export type RoomMemberProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type RoomListItem = {
  id: string;
  roomId: string;
  role: string;
  lastMessageText: string;
  lastMessageAt: string | null;
  peers: RoomMemberProfile[];
};

export async function ensureRoomForApplication(
  supabase: SupabaseClient<Database, 'public'>,
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

  let roomId = application.room_id;

  if (!roomId) {
    const { data: inserted, error: insertError } = await supabase
      .from('rooms')
      .insert({})
      .select('id')
      .single();

    if (insertError || !inserted) {
      throw insertError ?? new Error('failed to create room');
    }

    roomId = inserted.id;

    await supabase
      .from('applications')
      .update({ room_id: roomId })
      .eq('id', application.id);
  }

  const members: RoomMemberInsert[] = [
    { room_id: roomId, user_id: application.guest_id, role: 'guest' },
    { room_id: roomId, user_id: application.host_id, role: 'host' },
  ];

  await supabase
    .from('room_members')
    .upsert(members, { onConflict: 'room_id,user_id' });

  return { roomId, guestId: application.guest_id, hostId: application.host_id };
}

function resolveProfileName(profile: {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
} | null, fallback: string): string {
  if (!profile) return fallback;

  const {
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    name,
  } = profile;

  if (fullName && fullName.trim()) return fullName.trim();

  const combined = [firstName, lastName]
    .filter((part) => part && part.trim().length > 0)
    .join(' ')
    .trim();

  if (combined) return combined;

  if (name && name.trim()) return name.trim();

  return fallback;
}

export async function listRoomsForUser(
  supabase: SupabaseClient<any>,
  userId: string
): Promise<RoomListItem[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('room_members')
    .select('room_id, role')
    .eq('user_id', userId);

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

  type ProfileRow = {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    name: string | null;
    avatar_url: string | null;
  };

  const profileMap = new Map<string, ProfileRow>(
    (profiles ?? []).map((profile) => [profile.id, profile] as [string, ProfileRow])
  );

  const lastMessageMap = new Map<string, { text: string; created_at: string }>();

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
          text: message.content ?? '',
          created_at: message.created_at,
        });
      }
    })
  );

  const items = memberships.map((membership) => {
    const peers = (rawPeers ?? [])
      .filter((item) => item.room_id === membership.room_id)
      .map((item) => {
        const profile = profileMap.get(item.user_id) ?? null;
        return {
          id: item.user_id,
          name: resolveProfileName(profile, 'Участник чата'),
          avatarUrl: profile?.avatar_url ?? null,
        } satisfies RoomMemberProfile;
      });

    const lastMessage = lastMessageMap.get(membership.room_id) ?? null;

    return {
      id: membership.room_id,
      roomId: membership.room_id,
      role: membership.role,
      peers,
      lastMessageText: lastMessage?.text ?? '',
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
  supabase: SupabaseClient<Database, 'public'>,
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

  let roomId = request.room_id;

  if (!roomId) {
    const { data: inserted, error: insertError } = await supabase
      .from('rooms')
      .insert({})
      .select('id')
      .single();

    if (insertError || !inserted) {
      throw insertError ?? new Error('failed to create room');
    }

    roomId = inserted.id;

    await supabase
      .from('stay_requests')
      .update({ room_id: roomId })
      .eq('id', request.id);
  }

  const members: RoomMemberInsert[] = [
    { room_id: roomId, user_id: request.traveler_id, role: 'traveler' },
    { room_id: roomId, user_id: request.host_id, role: 'host' },
  ];

  await supabase
    .from('room_members')
    .upsert(members, {
      onConflict: 'room_id,user_id',
    });

  return { roomId, travelerId: request.traveler_id, hostId: request.host_id };
}

export async function ensureRoomForUsers(
  supabase: SupabaseClient<Database, 'public'>,
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

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({})
    .select('id')
    .single();

  if (roomError || !room) {
    throw roomError ?? new Error('failed to create room');
  }

  const members: RoomMemberInsert[] = [
    { room_id: room.id, user_id: userA, role: 'member' },
    { room_id: room.id, user_id: userB, role: 'member' },
  ];

  await supabase
    .from('room_members')
    .upsert(members, {
      onConflict: 'room_id,user_id',
    });

  return room.id;
}
