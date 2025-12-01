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
