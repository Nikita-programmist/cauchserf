'use client';

import { useEffect, useRef } from 'react';
import { listMessages } from '@/lib/chatService';

export function useRealtimeRoomMessages(
  conversationId: string,
  onInsert: (payload: { new: any }) => void,
  pollInterval = 5000
) {
  const lastMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const fetchLoop = async () => {
      const messages = await listMessages(conversationId);
      const latest = messages?.[messages.length - 1];
      if (latest && latest.id !== lastMessageId.current) {
        lastMessageId.current = latest.id;
        onInsert({ new: latest as any });
      }
    };

    fetchLoop();
    const interval = setInterval(fetchLoop, pollInterval);
    return () => clearInterval(interval);
  }, [conversationId, onInsert, pollInterval]);
}
