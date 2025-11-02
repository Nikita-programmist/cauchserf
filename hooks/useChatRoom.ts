'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabaseClient';

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  sender: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type PresencePayload = {
  typing: boolean;
  lastSeen: number;
};

type PresenceState = Record<string, PresencePayload>;

type UseChatRoomResult = {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  editMessage: (messageId: string, body: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  isSending: boolean;
  isTypingMap: Record<string, boolean>;
  setTyping: (typing: boolean) => void;
  presenceState: PresenceState;
  currentUserId: string | null;
};

export function useChatRoom(roomId: string): UseChatRoomResult {
  const supabase = getSupabaseClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const profilesRef = useRef<Record<string, ChatMessage['sender']>>({});
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      return undefined;
    }

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!isMounted) return;
        setCurrentUserId(data?.user?.id ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setCurrentUserId(null);
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    let abort = false;

    async function loadMessages() {
      try {
        const response = await fetch(`/api/chat/messages?roomId=${roomId}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load messages');
        }

        const payload = await response.json();
        if (abort) return;

        const loadedMessages: ChatMessage[] = (payload.messages ?? []).map((message: ChatMessage) => ({
          ...message,
          edited_at: message.edited_at ?? null,
          deleted_at: message.deleted_at ?? null,
        }));
        setMessages(loadedMessages);

        const profileMap: Record<string, ChatMessage['sender']> = {};
        for (const message of loadedMessages) {
          if (message.sender_id && message.sender) {
            profileMap[message.sender_id] = message.sender;
          }
        }
        profilesRef.current = profileMap;
      } catch (error) {
        console.error('Failed to load chat messages', error);
      }
    }

    loadMessages();

    return () => {
      abort = true;
    };
  }, [roomId]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessageId = payload.new.id as string;
          (async () => {
            let senderProfile = profilesRef.current[payload.new.sender_id as string] ?? null;

            if (!senderProfile) {
              const { data, error } = await supabase
                .from('chat_messages')
                .select(
                  `id, room_id, sender_id, body, created_at, read_at, edited_at, deleted_at,
                  sender:profiles!chat_messages_sender_id_fkey(id, display_name, avatar_url)`
                )
                .eq('id', newMessageId)
                .maybeSingle();

              if (error) {
                console.error('Failed to fetch message profile', error);
                return;
              }

              if (!data) return;

              const rawSender = data.sender as
                | ChatMessage['sender']
                | ChatMessage['sender'][]
                | null;
              if (Array.isArray(rawSender)) {
                senderProfile = rawSender[0] ?? null;
              } else {
                senderProfile = rawSender;
              }

              if (!senderProfile) {
                senderProfile = {
                  id: data.sender_id,
                  display_name: null,
                  avatar_url: null,
                };
              }
              profilesRef.current[data.sender_id as string] = senderProfile;

              setMessages((prev) => {
                if (prev.some((msg) => msg.id === data.id)) {
                  return prev;
                }

                const nextMessage: ChatMessage = {
                  id: data.id,
                  room_id: data.room_id,
                  sender_id: data.sender_id,
                  body: data.body,
                  created_at: data.created_at,
                  read_at: data.read_at,
                  edited_at: data.edited_at ?? null,
                  deleted_at: data.deleted_at ?? null,
                  sender: senderProfile,
                };

                return [...prev, nextMessage].sort((a, b) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
            } else {
              const nextMessage: ChatMessage = {
                id: payload.new.id as string,
                room_id: payload.new.room_id as string,
                sender_id: payload.new.sender_id as string,
                body: payload.new.body as string,
                created_at: payload.new.created_at as string,
                read_at: (payload.new.read_at as string | null) ?? null,
                edited_at: (payload.new.edited_at as string | null) ?? null,
                deleted_at: (payload.new.deleted_at as string | null) ?? null,
                sender: senderProfile,
              };
          
              setMessages((prev) => {
                if (prev.some((msg) => msg.id === nextMessage.id)) {
                  return prev;
                }
                return [...prev, nextMessage].sort((a, b) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
            }
          })();
        }
      );

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updatedId = payload.new.id as string;
          const updatedBody = payload.new.body as string;
          const editedAt = (payload.new.edited_at as string | null) ?? null;
          const deletedAt = (payload.new.deleted_at as string | null) ?? null;
          const readAt = (payload.new.read_at as string | null) ?? null;
          const createdAt = (payload.new.created_at as string | null) ?? null;

          setMessages((prev) => {
            let changed = false;
            const next = prev.map((msg) => {
              if (msg.id !== updatedId) return msg;

              changed = true;
              return {
                ...msg,
                body: updatedBody,
                edited_at: editedAt,
                deleted_at: deletedAt,
                read_at: readAt,
                created_at: createdAt ?? msg.created_at,
              };
            });

            if (!changed) {
              return prev;
            }

            return next;
          });
        }
      );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, supabase]);

  useEffect(() => {
    if (!supabase || !currentUserId) {
      return;
    }

    const channel = supabase.channel(`presence-${roomId}`, {
      config: {
        presence: { key: currentUserId },
      },
    });

    const refreshPresenceState = () => {
      const state = channel.presenceState<PresencePayload>();
      const nextState: PresenceState = {};
      Object.entries(state).forEach(([key, sessions]) => {
        if (!sessions || sessions.length === 0) return;
        const latest = sessions[sessions.length - 1];
        if (latest) {
          nextState[key] = latest;
        }
      });
      setPresenceState(nextState);
    };

    channel
      .on('presence', { event: 'sync' }, refreshPresenceState)
      .on('presence', { event: 'join' }, refreshPresenceState)
      .on('presence', { event: 'leave' }, refreshPresenceState);

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ typing: false, lastSeen: Date.now() }).catch(() => {
          // ignore track errors
        });
      }
    });

    presenceChannelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      channel
        .track({ typing: false, lastSeen: Date.now() })
        .catch(() => {
          // ignore errors on cleanup
        })
        .finally(() => {
          channel.unsubscribe();
          presenceChannelRef.current = null;
        });
    };
  }, [currentUserId, roomId, supabase]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      setIsSending(true);

      try {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ roomId, text: trimmed }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to send message');
        }

        const payload = await response.json();
        const message: ChatMessage | undefined = payload.message;

        if (!message) return;

        const normalized: ChatMessage = {
          ...message,
          edited_at: message.edited_at ?? null,
          deleted_at: message.deleted_at ?? null,
        };

        if (normalized.sender) {
          profilesRef.current[normalized.sender_id] = normalized.sender;
        }

        setMessages((prev) => {
          if (prev.some((msg) => msg.id === normalized.id)) {
            return prev;
          }
          return [...prev, normalized].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      } finally {
        setIsSending(false);
      }
    },
    [isSending, roomId]
  );

  const editMessage = useCallback(
    async (messageId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed || isSending) return;

      setIsSending(true);
      try {
        const response = await fetch(`/api/chat/messages/${messageId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: trimmed }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to edit message');
        }
      } finally {
        setIsSending(false);
      }
    },
    [isSending]
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    if (isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to delete message');
      }
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  const setTyping = useCallback(
    (typing: boolean) => {
      if (!presenceChannelRef.current) {
        return;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      presenceChannelRef.current
        .track({ typing, lastSeen: Date.now() })
        .catch(() => {
          // ignore track errors
        });

      if (typing) {
        typingTimeoutRef.current = setTimeout(() => {
          presenceChannelRef.current
            ?.track({ typing: false, lastSeen: Date.now() })
            .catch(() => {
              // ignore errors
            });
        }, 1500);
      }
    },
    []
  );

  const isTypingMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.entries(presenceState).forEach(([userId, payload]) => {
      map[userId] = Boolean(payload?.typing);
    });
    return map;
  }, [presenceState]);

  return {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    isSending,
    isTypingMap,
    setTyping,
    presenceState,
    currentUserId,
  };
}
