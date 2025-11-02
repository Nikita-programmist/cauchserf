'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

export function useChatRoom(roomId: string) {
  const supabase = createClientComponentClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    loadUser();
  }, [supabase]);

  useEffect(() => {
    if (!roomId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, room_id, sender_id, body, created_at, edited_at, deleted_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      setMessages(data ?? []);
    };

    loadMessages();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? (payload.new as ChatMessage) : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  const sendMessage = async (text: string) => {
    const body = text.trim();
    if (!body || !roomId || !currentUserId) return;
    setIsSending(true);
    try {
      await supabase.from('chat_messages').insert({
        room_id: roomId,
        sender_id: currentUserId,
        body,
      });
    } finally {
      setIsSending(false);
    }
  };

  const editMessage = async (messageId: string, body: string) => {
    const text = body.trim();
    if (!text) return;
    await fetch(`/api/chat/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    });
  };

  const deleteMessage = async (messageId: string) => {
    await fetch(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  };

  return {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    isSending,
  };
}
