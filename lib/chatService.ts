import { getServerSupabase, getServiceSupabase } from '@/lib/supabaseServer';

type ProfileRow = {
  id: string;
  avatar_url: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
};

export type ConversationListItem = {
  id: string;
  conversationId: string | null;
  type: 'conversation' | 'stay_request';
  requestId: string | null;
  lastMessageText: string;
  lastMessageAt: string | null;
  otherUser: {
    id: string | null;
    name: string;
    avatarUrl: string | null;
  };
  unreadCount: number;
};

type StayRequestRow = {
  id: string;
  traveler_id: string;
  host_id: string;
  message: string | null;
  created_at: string | null;
  conversation_id: string | null;
};

function resolveProfileName(profile: ProfileRow | null, fallback: string) {
  if (!profile) return fallback;

  const {
    full_name,
    first_name,
    last_name,
    name,
  } = profile;

  if (full_name && full_name.trim().length > 0) {
    return full_name.trim();
  }

  const combined = [first_name, last_name]
    .filter((part) => part && part.trim().length > 0)
    .join(' ')
    .trim();

  if (combined.length > 0) {
    return combined;
  }

  if (name && name.trim().length > 0) {
    return name.trim();
  }

  return fallback;
}

function resolveAvatarUrl(profile: ProfileRow | null) {
  if (!profile) return null;
  return profile.avatar_url ?? null;
}

// ВАЖНО: ниже используются таблицы, которые ты уже создал в Supabase SQL:
// conversations, messages, conversation_bookings, bookings, profiles

// Создаёт (или возвращает существующий) чат для конкретной брони
// Логика: одна бронь = один приватный диалог traveler<->host
export async function getOrCreateConversationForBooking(bookingId: string) {
  const admin = getServiceSupabase();

  // 1. найти бронирование
  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select('id, traveler_id, host_id')
    .eq('id', bookingId)
    .single();

  if (bookingErr || !booking) {
    throw new Error('booking not found');
  }

  // 2. проверить, уже связана ли эта бронь с разговором
  const { data: existingLink, error: linkErr } = await admin
    .from('conversation_bookings')
    .select('conversation_id')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (!linkErr && existingLink?.conversation_id) {
    return existingLink.conversation_id as string;
  }

  // 3. создать новый conversation
  const { data: conv, error: convErr } = await admin
    .from('conversations')
    .insert({
      traveler_id: booking.traveler_id,
      host_id: booking.host_id,
    })
    .select('id')
    .single();

  if (convErr || !conv) {
    throw new Error('failed to create conversation');
  }

  // 4. связать booking -> conversation
  const { error: insertErr } = await admin
    .from('conversation_bookings')
    .insert({
      booking_id: booking.id,
      conversation_id: conv.id,
    });

  if (insertErr) {
    throw new Error('failed to link conversation');
  }

  return conv.id as string;
}

// внутренняя утилита: убеждаемся что юзер реально участник разговора
async function getConversationRowForUser(
  conversationId: string,
  userId: string
) {
  const supabase = getServiceSupabase();

  const { data: convo, error } = await supabase
    .from('conversations')
    .select('id, traveler_id, host_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (error || !convo) return null;

  const allowed =
    convo.traveler_id === userId || convo.host_id === userId;

  if (!allowed) return null;

  return convo;
}

// список всех диалогов текущего юзера + превью
export async function listConversationsForUser(userId: string): Promise<ConversationListItem[]> {
  const supabase = getServerSupabase();
  const admin = getServiceSupabase();

  const { data: convs, error: convError } = await supabase
    .from('conversations')
    .select(
      'id, traveler_id, host_id, last_message_text, last_message_at'
    )
    .order('last_message_at', { ascending: false });

  if (convError) throw convError;

  const conversationIds = new Set<string>();
  const otherUserIds = new Set<string>();

  for (const conv of convs ?? []) {
    conversationIds.add(conv.id);
    const otherUserId =
      conv.traveler_id === userId ? conv.host_id : conv.traveler_id;
    if (otherUserId) {
      otherUserIds.add(otherUserId);
    }
  }

  const { data: requests, error: requestsError } = await admin
    .from('stay_requests')
    .select(
      'id, traveler_id, host_id, message, created_at, conversation_id'
    )
    .or(`traveler_id.eq.${userId},host_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (requestsError) throw requestsError;

  const requestByConversationId = new Map<string, StayRequestRow>();
  for (const request of (requests ?? []) as StayRequestRow[]) {
    if (request?.conversation_id) {
      requestByConversationId.set(request.conversation_id, request);
    }
  }

  for (const request of (requests ?? []) as StayRequestRow[]) {
    const otherUserId =
      request.traveler_id === userId
        ? request.host_id
        : request.traveler_id;
    if (otherUserId) {
      otherUserIds.add(otherUserId);
    }
  }

  const profileMap = new Map<string, ProfileRow>();
  if (otherUserIds.size > 0) {
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, full_name, first_name, last_name, name, avatar_url')
      .in('id', Array.from(otherUserIds));

    if (profilesError) throw profilesError;

    for (const profile of profiles ?? []) {
      if (profile?.id) {
        profileMap.set(profile.id, profile as ProfileRow);
      }
    }
  }

  const unreadCounts: Record<string, number> = {};
  if ((convs ?? []).length > 0) {
    const { data: unreadRows, error: unreadError } = await admin
      .from('messages')
      .select('conversation_id')
      .in(
        'conversation_id',
        (convs ?? []).map((conv: any) => conv.id)
      )
      .neq('sender_id', userId)
      .is('read_at', null);

    if (unreadError) throw unreadError;

    for (const row of unreadRows ?? []) {
      const convId = row.conversation_id as string;
      unreadCounts[convId] = (unreadCounts[convId] ?? 0) + 1;
    }
  }

  const result: ConversationListItem[] = [];

  for (const conv of convs ?? []) {
    const otherUserId =
      conv.traveler_id === userId ? conv.host_id : conv.traveler_id;
    const profile = otherUserId ? profileMap.get(otherUserId) ?? null : null;
    const linkedRequest = requestByConversationId.get(conv.id) ?? null;

    result.push({
      id: `conversation-${conv.id}`,
      conversationId: conv.id,
      type: 'conversation',
      requestId: linkedRequest?.id ?? null,
      lastMessageText: conv.last_message_text ?? '',
      lastMessageAt: conv.last_message_at ?? null,
      otherUser: {
        id: otherUserId ?? null,
        name: resolveProfileName(profile, 'User'),
        avatarUrl: resolveAvatarUrl(profile),
      },
      unreadCount: unreadCounts[conv.id] ?? 0,
    });
  }

  for (const request of requests ?? []) {
    if (request.conversation_id && conversationIds.has(request.conversation_id)) {
      continue;
    }

    const isTraveler = request.traveler_id === userId;
    const otherUserId = isTraveler ? request.host_id : request.traveler_id;
    const profile = otherUserId ? profileMap.get(otherUserId) ?? null : null;

    result.push({
      id: `request-${request.id}`,
      conversationId: request.conversation_id ?? null,
      type: 'stay_request',
      requestId: request.id,
      lastMessageText: request.message ?? '',
      lastMessageAt: request.created_at ?? null,
      otherUser: {
        id: otherUserId ?? null,
        name: resolveProfileName(
          profile,
          isTraveler ? 'Хост' : 'Путешественник'
        ),
        avatarUrl: resolveAvatarUrl(profile),
      },
      unreadCount: 0,
    });
  }

  result.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });

  return result;
}

// одна конкретная беседа + история сообщений
export async function getConversationWithMessages(
  conversationId: string,
  userId: string
) {
  const convRow = await getConversationRowForUser(conversationId, userId);
  if (!convRow) {
    throw new Error('forbidden');
  }

  const supabase = getServerSupabase();
  const admin = getServiceSupabase();

  // сами сообщения (юзер-клиент => RLS не даст левые чаты)
  const { data: msgs, error: msgErr } = await supabase
    .from('messages')
    .select('id, sender_id, text, created_at, read_at, edited_at, deleted_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (msgErr) throw msgErr;

  // собираем инфу про меня и собеседника
  const otherUserId =
    convRow.traveler_id === userId ? convRow.host_id : convRow.traveler_id;

  const { data: meProfile } = await admin
    .from('profiles')
    .select('id, full_name, first_name, last_name, name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  const { data: otherProfile } = await admin
    .from('profiles')
    .select('id, full_name, first_name, last_name, name, avatar_url')
    .eq('id', otherUserId)
    .maybeSingle();

  return {
    conversationId,
    me: {
      id: userId,
      name: resolveProfileName(meProfile as ProfileRow | null, 'Me'),
      avatarUrl: resolveAvatarUrl(meProfile as ProfileRow | null),
    },
    otherUser: {
      id: otherUserId,
      name: resolveProfileName(otherProfile as ProfileRow | null, 'User'),
      avatarUrl: resolveAvatarUrl(otherProfile as ProfileRow | null),
    },
    messages: (msgs ?? []).map((m: any) => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.text,
      createdAt: m.created_at,
      readAt: m.read_at,
      editedAt: m.edited_at,
      deletedAt: m.deleted_at,
    })),
  };
}

// отправить новое сообщение
export async function sendMessage(
  conversationId: string,
  userId: string,
  text: string
) {
  const clean = text.trim();
  if (!clean) throw new Error('empty');

  // проверка доступа
  const convRow = await getConversationRowForUser(conversationId, userId);
  if (!convRow) {
    throw new Error('forbidden');
  }

  const supabase = getServiceSupabase();

  // вставляем сообщение (через сервисный клиент с ручной проверкой доступа)
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: conversationId,
      sender_id: userId,
      content: clean,
    })
    .select('id, room_id, sender_id, content, created_at, edited_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    senderId: data.sender_id,
    text: data.content,
    createdAt: data.created_at,
    readAt: null,
    editedAt: data.edited_at ?? null,
  };
}

export async function getMessagesForConversation(
  conversationId: string,
  userId: string
) {
  const convRow = await getConversationRowForUser(conversationId, userId);
  if (!convRow) {
    throw new Error('forbidden');
  }

  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, room_id, sender_id, content, created_at, edited_at')
    .eq('room_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    content: row.content as string,
    sender_id: row.sender_id as string,
    created_at: row.created_at as string,
    edited_at: (row.edited_at as string | null) ?? null,
  }));
}

// пометить все входящие как прочитанные (read_at)
export async function markConversationRead(
  conversationId: string,
  userId: string
) {
  const convRow = await getConversationRowForUser(conversationId, userId);
  if (!convRow) {
    throw new Error('forbidden');
  }

  const admin = getServiceSupabase();

  const { error } = await admin
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);

  if (error) throw error;

  return { ok: true };
}

export async function ensureConversationForStayRequest(
  requestId: string,
  userId: string
) {
  const admin = getServiceSupabase();

  const { data: request, error: requestError } = await admin
    .from('stay_requests')
    .select(
      'id, traveler_id, host_id, message, created_at, conversation_id'
    )
    .eq('id', requestId)
    .maybeSingle();

  if (requestError || !request) {
    throw new Error('not_found');
  }

  const participant =
    request.traveler_id === userId || request.host_id === userId;

  if (!participant) {
    throw new Error('forbidden');
  }

  let conversationId: string | null = request.conversation_id ?? null;

  if (!conversationId) {
    const { data: existingConversation } = await admin
      .from('conversations')
      .select('id')
      .eq('traveler_id', request.traveler_id)
      .eq('host_id', request.host_id)
      .maybeSingle();

    if (existingConversation?.id) {
      conversationId = existingConversation.id;
    } else {
      const { data: newConversation, error: createError } = await admin
        .from('conversations')
        .insert({
          traveler_id: request.traveler_id,
          host_id: request.host_id,
        })
        .select('id')
        .single();

      if (createError) {
        if (createError.code === '23505') {
          const { data: conflictConversation, error: conflictError } =
            await admin
              .from('conversations')
              .select('id')
              .eq('traveler_id', request.traveler_id)
              .eq('host_id', request.host_id)
              .maybeSingle();

          if (conflictError) {
            throw conflictError;
          }

          conversationId = conflictConversation?.id ?? null;
        } else {
          throw createError;
        }
      } else {
        conversationId = newConversation?.id ?? null;
      }
    }

    if (!conversationId) {
      throw new Error('conversation_failed');
    }

    const { error: updateError } = await admin
      .from('stay_requests')
      .update({ conversation_id: conversationId })
      .eq('id', request.id);

    if (updateError) {
      throw updateError;
    }

    const trimmedMessage = request.message?.trim();

    if (trimmedMessage) {
      const { count: existingMessages } = await admin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      if (!existingMessages || existingMessages === 0) {
        await admin.from('messages').insert({
          conversation_id: conversationId,
          sender_id: request.traveler_id,
          text: trimmedMessage,
          created_at: request.created_at ?? new Date().toISOString(),
        });
      }
    }
  }

  return { conversationId };
}
