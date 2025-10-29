
'use client';

import { useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabaseClient';

// подписка на realtime апдейты по конкретному conversation_id
export function useRealtimeConversation(
  conversationId: string,
  onNewMessage: (msg: {
    id: string;
    conversation_id: string;
    sender_id: string;
    text: string;
    created_at: string;
    read_at: string | null;
  }) => void,
  onMessageUpdate?: (msg: any) => void
) {
  useEffect(() => {
    const supabase = getBrowserSupabase();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onNewMessage(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (onMessageUpdate) {
            onMessageUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onNewMessage, onMessageUpdate]);
}
