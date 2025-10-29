import { getServerSupabase, getServiceSupabase } from '@/lib/supabaseServer';

type ProfileRow = {
  id: string;
  avatar_url: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
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
  const supabase = getServerSupabase();

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
export async function listConversationsForUser(userId: string) {
  const supabase = getServerSupabase();
  const admin = getServiceSupabase();

  // RLS уже не отдаст чужие разговоры, так что можно без фильтра .or()
  const { data: convs, error } = await supabase
    .from('conversations')
    .select(
      'id, traveler_id, host_id, last_message_text, last_message_at'
    )
    .order('last_message_at', { ascending: false });

  if (error) throw error;

  const result: any[] = [];

  for (const conv of convs ?? []) {
    const otherUserId =
      conv.traveler_id === userId ? conv.host_id : conv.traveler_id;

    // инфа о собеседнике
    const { data: profile } = await admin
      .from('profiles')
      .select('id, full_name, first_name, last_name, name, avatar_url')
      .eq('id', otherUserId)
      .maybeSingle();

    // сколько у меня непрочитанных
    const { count: unreadCount } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .neq('sender_id', userId)
      .is('read_at', null);

    result.push({
      id: conv.id,
      conversationId: conv.id,
      type: 'conversation',
      requestId: null,
      lastMessageText: conv.last_message_text ?? '',
      lastMessageAt: conv.last_message_at ?? null,
      otherUser: {
        id: profile?.id ?? otherUserId,
        name: resolveProfileName(profile as ProfileRow | null, 'User'),
        avatarUrl: resolveAvatarUrl(profile as ProfileRow | null),
      },
      unreadCount: unreadCount ?? 0,
    });
  }

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
    .select('id, sender_id, text, created_at, read_at')
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

  const supabase = getServerSupabase();

  // вставляем сообщение (через юзер-клиент => RLS "insert_messages_if_participant")
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      text: clean,
    })
    .select('id, sender_id, text, created_at, read_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    senderId: data.sender_id,
    text: data.text,
    createdAt: data.created_at,
    readAt: data.read_at,
  };
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
