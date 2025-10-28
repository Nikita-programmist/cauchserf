import { useEffect } from 'react';
import type { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabaseClient';

type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  read_at: string | null;
};

type MessageCallbackPayload = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
};

function mapPayload(row: MessageRecord): MessageCallbackPayload {
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
  conversationId: string | null,
  onNewMessage: (message: MessageCallbackPayload) => void,
  onRead?: (readerId: string) => void
) {
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

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
          const row = payload.new;
          if (!row) return;
          onNewMessage(mapPayload(row));
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
          const row = payload.new;
          if (!row) return;
          onNewMessage(mapPayload(row));
          if (row.read_at && onRead) {
            onRead(row.sender_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onNewMessage, onRead]);
}
