import { apiClient } from './apiClient';

export type ConversationSummary = {
  id: string;
  stayRequestId?: string | null;
  hostId: string;
  guestId: string;
  lastMessageText?: string | null;
  lastMessageAt?: string | null;
};

export type MessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export type RoomPeer = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

export type RoomListItem = {
  id: string;
  roomId: string | null;
  stayRequestId?: string | null;
  peers: RoomPeer[];
  lastMessageText?: string | null;
  lastMessageAt?: string | null;
};

export async function getOrCreateConversation(params: {
  stayRequestId?: string;
  hostId?: string;
  guestId?: string;
}) {
  return apiClient.post('/chat/conversations', params);
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const conversations = await apiClient.get('/chat/conversations');
  return (conversations ?? []).map((conv: any) => ({
    id: conv.id,
    stayRequestId: conv.stayRequestId,
    hostId: conv.hostId,
    guestId: conv.guestId,
    lastMessageText: conv.messages?.[0]?.content ?? null,
    lastMessageAt: conv.messages?.[0]?.createdAt ?? null
  }));
}

export async function listMessages(conversationId: string): Promise<MessageDto[]> {
  return apiClient.get(`/chat/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId: string, content: string) {
  return apiClient.post(`/chat/conversations/${conversationId}/messages`, { content });
}

export async function ensureRoomForStayRequest(
  _unused: unknown,
  stayRequestId: string
) {
  const conversation = await apiClient.post('/chat/conversations', { stayRequestId });

  if (!conversation?.id) {
    return null;
  }

  return { roomId: conversation.id as string };
}

export async function ensureRoomForApplication(
  _unused: unknown,
  applicationId: string
) {
  const conversation = await apiClient.post('/chat/conversations', {
    stayRequestId: applicationId,
  });

  if (!conversation?.id) {
    return null;
  }

  return { roomId: conversation.id as string };
}

export async function listRoomsForUser(userId: string): Promise<RoomListItem[]> {
  const conversations = await apiClient.get('/chat/conversations');

  return (conversations ?? []).map((conversation: any) => {
    const messages = Array.isArray(conversation?.messages)
      ? conversation.messages
      : [];
    const lastMessage = messages[0] ?? null;

    const peers: RoomPeer[] = [conversation?.host, conversation?.guest]
      .filter(Boolean)
      .filter((peer: any) => peer?.id && peer.id !== userId)
      .map((peer: any) => ({
        id: String(peer.id),
        name: peer.name ?? peer.email ?? null,
        avatarUrl: peer.avatarUrl ?? null,
      }));

    return {
      id: String(conversation?.id ?? ''),
      roomId: conversation?.id ?? null,
      stayRequestId: conversation?.stayRequestId ?? null,
      peers,
      lastMessageText: lastMessage?.content ?? null,
      lastMessageAt: lastMessage?.createdAt ?? null,
    } satisfies RoomListItem;
  });
}
