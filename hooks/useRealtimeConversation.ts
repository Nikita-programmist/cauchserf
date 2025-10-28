'use client';

import { useEffect } from 'react';
import type { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';

type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  read_at: string | null;
};

type MessagePayload = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
};

function mapRow(row: MessageRecord): MessagePayload {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.text,
    createdAt: row.created_at,
    readAt: row.read_at
  };
}

export function useRealtimeConversation(
  conversationId: string | null | undefined,
  onNewMessage: (message: MessagePayload) => void,
  onMessageUpdate?: (message: MessagePayload) => void
) {
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: RealtimePostgresInsertPayload<MessageRecord>) => {
          if (!payload.new) return;
          onNewMessage(mapRow(payload.new));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: RealtimePostgresUpdatePayload<MessageRecord>) => {
          if (!payload.new) return;
          const mapped = mapRow(payload.new);
          onMessageUpdate?.(mapped);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onMessageUpdate, onNewMessage]);
}
