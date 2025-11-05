// hooks/useChatRoom.ts
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

  // кто я
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    loadUser();
  }, [supabase]);

  // загрузка + подписка
  useEffect(() => {
    if (!roomId) return;

    const load = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, room_id, sender_id, body, created_at, edited_at, deleted_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      setMessages(data ?? []);
    };

    load();

    const channel = supabase
      .channel(`chat-room-${roomId}`)
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
    if (!body || !roomId) return;
    setIsSending(true);

    try {
      const res = await fetch(`/api/conversations/${roomId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: body }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to send message');
      }
    } finally {
      setIsSending(false);
    }
  };

  const editMessage = async (id: string, body: string) => {
    const text = body.trim();
    if (!text) return;
    await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  };

  const deleteMessage = async (id: string) => {
    await fetch(`/api/messages/${id}`, {
      method: 'DELETE',
    });
  };

  return {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    isSending,
    currentUserId,
  };
}

