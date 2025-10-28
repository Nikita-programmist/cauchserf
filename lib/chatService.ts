import type { NextRequest } from 'next/server';
import { getServerSupabase, getCurrentUser, type CurrentUser } from './supabaseServer';

class ChatServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ProfileRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
};

type ConversationRow = {
  id: string;
  traveler_id: string;
  host_id: string;
  last_message_text: string | null;
  last_message_at: string | null;
  updated_at: string;
  traveler?: ProfileRow | null;
  host?: ProfileRow | null;
};

function mapProfile(profile: ProfileRow | null | undefined, fallbackId: string): {
  id: string;
  name: string | null;
  avatarUrl: string | null;
} {
  if (!profile) {
    return {
      id: fallbackId,
      name: null,
      avatarUrl: null
    };
  }

  const first = profile.first_name?.trim() ?? '';
  const last = profile.last_name?.trim() ?? '';
  const combined = `${first} ${last}`.trim();
  const resolvedName = combined || profile.name?.trim() || null;

  return {
    id: profile.id,
    name: resolvedName,
    avatarUrl: profile.avatar_url ?? null
  };
}

async function requireUser(req: NextRequest): Promise<CurrentUser> {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new ChatServiceError(401, 'Not authenticated');
  }
  return user;
}

async function fetchConversationById(conversationId: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `id, traveler_id, host_id, last_message_text, last_message_at, updated_at,
       traveler:traveler_id (id, first_name, last_name, name, avatar_url),
       host:host_id (id, first_name, last_name, name, avatar_url)`
    )
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    throw new ChatServiceError(500, error.message);
  }

  if (!data) {
    throw new ChatServiceError(404, 'Conversation not found');
  }

  return data as unknown as ConversationRow;
}

async function ensureParticipant(conversation: ConversationRow, userId: string) {
  if (conversation.traveler_id !== userId && conversation.host_id !== userId) {
    throw new ChatServiceError(403, 'You are not allowed to access this conversation');
  }
}

export async function getOrCreateConversationForBooking(req: NextRequest, bookingId: string) {
  const user = await requireUser(req);
  const supabase = getServerSupabase();

  const { data: booking, error: bookingError } = await supabase
    .from('stay_requests')
    .select('id, traveler_id, host_id, conversation_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new ChatServiceError(500, bookingError.message);
  }

  if (!booking) {
    throw new ChatServiceError(404, 'Booking not found');
  }

  if (booking.traveler_id !== user.id && booking.host_id !== user.id) {
    throw new ChatServiceError(403, 'You are not allowed to access this booking');
  }

  const { data: existingLink, error: linkError } = await supabase
    .from('conversation_bookings')
    .select('conversation_id')
    .eq('booking_id', booking.id)
    .maybeSingle();

  if (linkError) {
    throw new ChatServiceError(500, linkError.message);
  }

  if (existingLink?.conversation_id) {
    const conversation = await fetchConversationById(existingLink.conversation_id);
    await ensureParticipant(conversation, user.id);
    return conversation.id;
  }

  if (booking.conversation_id) {
    const conversation = await fetchConversationById(booking.conversation_id);
    await ensureParticipant(conversation, user.id);

    await supabase
      .from('conversation_bookings')
      .upsert({ booking_id: booking.id, conversation_id: conversation.id });

    return conversation.id;
  }

  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .insert({ traveler_id: booking.traveler_id, host_id: booking.host_id })
    .select('id')
    .single();

  if (conversationError) {
    throw new ChatServiceError(500, conversationError.message);
  }

  const conversationId = conversationData?.id;
  if (!conversationId) {
    throw new ChatServiceError(500, 'Failed to create conversation');
  }

  const { error: linkInsertError } = await supabase
    .from('conversation_bookings')
    .upsert({ booking_id: booking.id, conversation_id: conversationId });

  if (linkInsertError) {
    throw new ChatServiceError(500, linkInsertError.message);
  }

  if (!booking.conversation_id) {
    await supabase
      .from('stay_requests')
      .update({ conversation_id: conversationId })
      .eq('id', booking.id);
  }

  return conversationId;
}

export async function listConversationsForUser(req: NextRequest) {
  const user = await requireUser(req);
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('conversations')
    .select(
      `id, traveler_id, host_id, last_message_text, last_message_at, updated_at,
       traveler:traveler_id (id, first_name, last_name, name, avatar_url),
       host:host_id (id, first_name, last_name, name, avatar_url)`
    )
    .or(`traveler_id.eq.${user.id},host_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) {
    throw new ChatServiceError(500, error.message);
  }

  const conversations = (data ?? []) as unknown as ConversationRow[];
  const ids = conversations.map((conversation) => conversation.id);

  const unreadCounts = new Map<string, number>();

  await Promise.all(
    ids.map(async (conversationId) => {
      const { count, error: countError } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (countError) {
        throw new ChatServiceError(500, countError.message);
      }

      unreadCounts.set(conversationId, count ?? 0);
    })
  );

  return conversations.map((conversation) => {
    const isTraveler = conversation.traveler_id === user.id;
    const otherProfile = isTraveler ? conversation.host : conversation.traveler;
    const other = mapProfile(otherProfile ?? null, isTraveler ? conversation.host_id : conversation.traveler_id);

    return {
      id: conversation.id,
      lastMessageText: conversation.last_message_text,
      lastMessageAt: conversation.last_message_at,
      otherUser: other,
      unreadCount: unreadCounts.get(conversation.id) ?? 0
    };
  });
}

export async function getConversationWithMessages(req: NextRequest, conversationId: string) {
  const user = await requireUser(req);
  const supabase = getServerSupabase();

  const conversation = await fetchConversationById(conversationId);
  await ensureParticipant(conversation, user.id);

  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .select('id, sender_id, text, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw new ChatServiceError(500, messagesError.message);
  }

  const meProfile = conversation.traveler_id === user.id ? conversation.traveler : conversation.host;
  const otherProfile = conversation.traveler_id === user.id ? conversation.host : conversation.traveler;

  return {
    conversationId: conversation.id,
    me: mapProfile(meProfile ?? null, user.id),
    otherUser: mapProfile(otherProfile ?? null, conversation.traveler_id === user.id ? conversation.host_id : conversation.traveler_id),
    messages: (messagesData ?? []).map((message) => ({
      id: message.id,
      senderId: message.sender_id,
      text: message.text,
      createdAt: message.created_at,
      readAt: message.read_at
    }))
  };
}

export async function sendMessage(req: NextRequest, conversationId: string, text: string) {
  const user = await requireUser(req);
  const supabase = getServerSupabase();

  const trimmed = text.trim();
  if (!trimmed) {
    throw new ChatServiceError(400, 'Message text is required');
  }

  const conversation = await fetchConversationById(conversationId);
  await ensureParticipant(conversation, user.id);

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, text: trimmed })
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

export async function markConversationRead(req: NextRequest, conversationId: string) {
  const user = await requireUser(req);
  const supabase = getServerSupabase();

  const conversation = await fetchConversationById(conversationId);
  await ensureParticipant(conversation, user.id);

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null);

  if (error) {
    throw new ChatServiceError(500, error.message);
  }

  return { ok: true };
}

export { ChatServiceError };
