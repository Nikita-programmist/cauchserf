import { getServerSupabase, getServiceSupabase } from './supabaseServer';

export class ChatServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ConversationRow = {
  id: string;
  traveler_id: string;
  host_id: string;
  last_message_text: string | null;
  last_message_at: string | null;
  created_at?: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

function mapProfile(profile: ProfileRow | undefined | null, fallbackId: string) {
  return {
    id: profile?.id ?? fallbackId,
    name: profile?.name ?? null,
    avatarUrl: profile?.avatar_url ?? null
  };
}

export async function getOrCreateConversationForBooking(bookingId: string): Promise<string> {
  if (!bookingId) {
    throw new ChatServiceError(400, 'Booking id is required');
  }

  const service = getServiceSupabase();

  const { data: booking, error: bookingError } = await service
    .from('bookings')
    .select('id, traveler_id, host_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new ChatServiceError(500, bookingError.message);
  }

  if (!booking) {
    throw new ChatServiceError(404, 'Booking not found');
  }

  const { data: existingLink, error: linkError } = await service
    .from('conversation_bookings')
    .select('conversation_id')
    .eq('booking_id', booking.id)
    .maybeSingle();

  if (linkError) {
    throw new ChatServiceError(500, linkError.message);
  }

  if (existingLink?.conversation_id) {
    return existingLink.conversation_id;
  }

  const { data: insertedConversation, error: conversationError } = await service
    .from('conversations')
    .insert({ traveler_id: booking.traveler_id, host_id: booking.host_id })
    .select('id')
    .single();

  if (conversationError) {
    throw new ChatServiceError(500, conversationError.message);
  }

  const conversationId = insertedConversation.id;

  const { error: linkInsertError } = await service
    .from('conversation_bookings')
    .insert({ booking_id: booking.id, conversation_id: conversationId });

  if (linkInsertError) {
    if (linkInsertError.code === '23505') {
      const { data: existing, error: existingError } = await service
        .from('conversation_bookings')
        .select('conversation_id')
        .eq('booking_id', booking.id)
        .maybeSingle();
      if (existingError) {
        throw new ChatServiceError(500, existingError.message);
      }
      if (existing?.conversation_id) {
        return existing.conversation_id;
      }
    }
    throw new ChatServiceError(500, linkInsertError.message);
  }

  return conversationId;
}

export async function getConversationRowForUser(
  conversationId: string,
  userId: string
): Promise<ConversationRow | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('conversations')
    .select('id, traveler_id, host_id, last_message_text, last_message_at, created_at')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    throw new ChatServiceError(500, error.message);
  }

  if (!data) {
    return null;
  }

  if (data.traveler_id !== userId && data.host_id !== userId) {
    return null;
  }

  return data;
}

export async function listConversationsForUser(userId: string) {
  if (!userId) {
    throw new ChatServiceError(400, 'User id is required');
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('conversations')
    .select('id, traveler_id, host_id, last_message_text, last_message_at, created_at')
    .or(`traveler_id.eq.${userId},host_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsLast: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new ChatServiceError(500, error.message);
  }

  const conversations = data ?? [];
  const conversationIds = conversations.map((item) => item.id);
  const otherUserIds = conversations.reduce<Set<string>>((acc, item) => {
    const otherId = item.traveler_id === userId ? item.host_id : item.traveler_id;
    if (otherId) {
      acc.add(otherId);
    }
    return acc;
  }, new Set());

  const service = getServiceSupabase();

  const profilesMap = new Map<string, ProfileRow>();
  if (otherUserIds.size > 0) {
    const { data: profilesData, error: profilesError } = await service
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', Array.from(otherUserIds));

    if (profilesError) {
      throw new ChatServiceError(500, profilesError.message);
    }

    (profilesData ?? []).forEach((profile) => {
      profilesMap.set(profile.id, profile);
    });
  }

  const unreadCounts = new Map<string, number>();
  if (conversationIds.length > 0) {
    const { data: unreadData, error: unreadError } = await service
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (unreadError) {
      throw new ChatServiceError(500, unreadError.message);
    }

    (unreadData ?? []).forEach((row) => {
      const current = unreadCounts.get(row.conversation_id) ?? 0;
      unreadCounts.set(row.conversation_id, current + 1);
    });
  }

  return conversations.map((conversation) => {
    const otherId = conversation.traveler_id === userId ? conversation.host_id : conversation.traveler_id;
    const otherProfile = profilesMap.get(otherId);

    return {
      id: conversation.id,
      lastMessageText: conversation.last_message_text,
      lastMessageAt: conversation.last_message_at,
      otherUser: mapProfile(otherProfile, otherId),
      unreadCount: unreadCounts.get(conversation.id) ?? 0
    };
  });
}

export async function getConversationWithMessages(conversationId: string, userId: string) {
  if (!userId) {
    throw new ChatServiceError(400, 'User id is required');
  }

  const conversation = await getConversationRowForUser(conversationId, userId);

  if (!conversation) {
    throw new ChatServiceError(403, 'Conversation not accessible');
  }

  const supabase = getServerSupabase();
  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .select('id, sender_id, text, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw new ChatServiceError(500, messagesError.message);
  }

  const service = getServiceSupabase();
  const participantIds = [conversation.traveler_id, conversation.host_id];
  const { data: profileRows, error: profileError } = await service
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', participantIds);

  if (profileError) {
    throw new ChatServiceError(500, profileError.message);
  }

  const profileMap = new Map<string, ProfileRow>();
  (profileRows ?? []).forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  const otherId = conversation.traveler_id === userId ? conversation.host_id : conversation.traveler_id;

  return {
    conversationId: conversation.id,
    me: mapProfile(profileMap.get(userId), userId),
    otherUser: mapProfile(profileMap.get(otherId), otherId),
    messages: (messagesData ?? []).map((message) => ({
      id: message.id,
      senderId: message.sender_id,
      text: message.text,
      createdAt: message.created_at,
      readAt: message.read_at
    }))
  };
}

export async function sendMessage(conversationId: string, userId: string, text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new ChatServiceError(400, 'Message text is required');
  }

  const conversation = await getConversationRowForUser(conversationId, userId);

  if (!conversation) {
    throw new ChatServiceError(403, 'Conversation not accessible');
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: userId, text: trimmed })
    .select('id, sender_id, text, created_at, read_at')
    .single();

  if (error) {
    throw new ChatServiceError(500, error.message);
  }

  if (!data) {
    throw new ChatServiceError(500, 'Failed to send message');
  }

  return {
    id: data.id,
    senderId: data.sender_id,
    text: data.text,
    createdAt: data.created_at,
    readAt: data.read_at
  };
}

export async function markConversationRead(conversationId: string, userId: string) {
  const conversation = await getConversationRowForUser(conversationId, userId);

  if (!conversation) {
    throw new ChatServiceError(403, 'Conversation not accessible');
  }

  const service = getServiceSupabase();
  const { error } = await service
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);

  if (error) {
    throw new ChatServiceError(500, error.message);
  }

  return { ok: true };
}
