'use client';

import { useEffect, useState } from 'react';
import ChatRoomView from '@/app/chat/[roomId]/ChatRoomView';
import type { ProfileSummary } from '@/lib/chatRooms';
import { getSupabaseClient } from '@/lib/supabaseClient';

type ChatWindowProps = {
  roomId: string;
  currentUserId: string;
};

type ChatWindowState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; currentUser: ProfileSummary; otherUser: ProfileSummary };

function normalizeProfile(
  fallbackId: string,
  raw: ProfileSummary | ProfileSummary[] | null | undefined
): ProfileSummary {
  if (!raw) {
    return {
      id: fallbackId,
      display_name: null,
      avatar_url: null,
    };
  }

  if (Array.isArray(raw)) {
    const first = raw[0];
    if (first) {
      return {
        id: first.id,
        display_name: first.display_name ?? null,
        avatar_url: first.avatar_url ?? null,
      };
    }
    return {
      id: fallbackId,
      display_name: null,
      avatar_url: null,
    };
  }

  return {
    id: raw.id,
    display_name: raw.display_name ?? null,
    avatar_url: raw.avatar_url ?? null,
  };
}

export default function ChatWindow({ roomId, currentUserId }: ChatWindowProps) {
  const supabase = getSupabaseClient();
  const [state, setState] = useState<ChatWindowState>({ status: 'loading' });

  useEffect(() => {
    if (!supabase) {
      setState({
        status: 'error',
        message:
          'Чат недоступен: Supabase не настроен. Проверьте переменные окружения.',
      });
      return;
    }

    let active = true;
    setState({ status: 'loading' });

    const loadRoom = async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(
          `id, traveler_id, host_id,
          traveler:profiles!chat_rooms_traveler_id_fkey(id, display_name, avatar_url),
          host:profiles!chat_rooms_host_id_fkey(id, display_name, avatar_url)`
        )
        .eq('id', roomId)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (error) {
        setState({ status: 'error', message: error.message });
        return;
      }

      if (!data) {
        setState({ status: 'error', message: 'Чат не найден.' });
        return;
      }

      const traveler = normalizeProfile(
        data.traveler_id as string,
        (data as any).traveler
      );
      const host = normalizeProfile(data.host_id as string, (data as any).host);

      const isTraveler = traveler.id === currentUserId;
      const isHost = host.id === currentUserId;

      if (!isTraveler && !isHost) {
        setState({
          status: 'error',
          message: 'Вы не являетесь участником этого чата.',
        });
        return;
      }

      const currentProfile = isTraveler ? traveler : host;
      const otherProfile = isTraveler ? host : traveler;

      setState({
        status: 'ready',
        currentUser: currentProfile,
        otherUser: otherProfile,
      });
    };

    void loadRoom();

    return () => {
      active = false;
    };
  }, [currentUserId, roomId, supabase]);

  if (state.status === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center bg-white/60 text-sm text-neutral-500">
        Загружаем чат…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-1 items-center justify-center bg-white/60 px-6 text-center text-sm text-red-500">
        {state.message}
      </div>
    );
  }

  return (
    <ChatRoomView
      roomId={roomId}
      currentUser={state.currentUser}
      otherUser={state.otherUser}
    />
  );
}
