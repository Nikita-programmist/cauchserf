'use client';

import { useEffect } from 'react';

import { getBrowserSupabase } from '@/lib/supabaseClient';

type RoomMessagePayload = {
  id: string;
  room_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
};

export function useRealtimeRoomMessages(
  roomId: string,
  onInsert: (payload: { new: RoomMessagePayload }) => void
) {
  useEffect(() => {
    if (!roomId || roomId === '__none__') {
      return;
    }

    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          onInsert(payload as unknown as { new: RoomMessagePayload });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, onInsert]);
}
