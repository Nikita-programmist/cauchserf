'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useRealtimeConversation } from '../../hooks/useRealtimeConversation';
import { sendChatMessage, markConversationReadClient } from '../../lib/chatClient';
import { cn } from '../../lib/utils';

type Participant = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

type ConversationPayload = {
  conversationId: string;
  me: Participant;
  otherUser: Participant;
  messages: Array<{
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    readAt: string | null;
  }>;
};

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
  optimistic?: boolean;
};

type ChatWindowProps = {
  conversationId: string | null;
  currentUserId: string | null;
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWindow({ conversationId, currentUserId }: ChatWindowProps) {
  const [conversation, setConversation] = useState<ConversationPayload | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const markAsRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    try {
      await markConversationReadClient(conversationId);
      setMessages((prev) =>
        prev.map((message) =>
          message.senderId === currentUserId
            ? message
            : {
                ...message,
                readAt: message.readAt ?? new Date().toISOString()
              }
        )
      );
    } catch (err) {
      console.error('Failed to mark conversation as read', err);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      setError('');
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    const load = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: 'Не удалось загрузить чат' }));
          throw new Error(payload.error ?? 'Не удалось загрузить чат');
        }
        const data = (await response.json()) as ConversationPayload;
        if (!active) return;
        setConversation(data);
        setMessages(
          data.messages.map((message) => ({
            id: message.id,
            senderId: message.senderId,
            text: message.text,
            createdAt: message.createdAt,
            readAt: message.readAt
          }))
        );
        await markAsRead();
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить чат');
        setConversation(null);
        setMessages([]);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [conversationId, markAsRead]);

  useEffect(() => {
    setError('');
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const handleFocus = () => {
      void markAsRead();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        void markAsRead();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [conversationId, markAsRead]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [messages]);

  const handleRealtimeMessage = useCallback(
    (incoming: { id: string; senderId: string; text: string; createdAt: string; readAt: string | null }) => {
      setMessages((prev) => {
        const index = prev.findIndex((message) => message.id === incoming.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...incoming, optimistic: false };
          return updated;
        }
        return [...prev, { ...incoming }];
      });

      if (incoming.senderId !== currentUserId) {
        void markAsRead();
      }
    },
    [currentUserId, markAsRead]
  );

  useRealtimeConversation(conversationId, handleRealtimeMessage);

  const handleSend = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    const trimmed = draft.trim();
    if (!trimmed) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const now = new Date().toISOString();
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      senderId: currentUserId,
      text: trimmed,
      createdAt: now,
      readAt: null,
      optimistic: true
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setDraft('');
    setSending(true);

    try {
      const saved = await sendChatMessage(conversationId, trimmed);
      setMessages((prev) => {
        const index = prev.findIndex((message) => message.id === optimisticId);
        if (index === -1) {
          if (prev.some((message) => message.id === saved.id)) {
            return prev.map((message) =>
              message.id === saved.id
                ? { ...message, senderId: saved.senderId, text: saved.text, createdAt: saved.createdAt, readAt: saved.readAt, optimistic: false }
                : message
            );
          }
          return [...prev, { ...saved, optimistic: false }];
        }
        const updated = [...prev];
        updated[index] = { ...saved, optimistic: false };
        return updated;
      });
      await markAsRead();
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  }, [conversationId, currentUserId, draft, markAsRead]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  const header = useMemo(() => {
    if (!conversation) {
      return null;
    }

    const other = conversation.otherUser;
    const name = other.name ?? 'Собеседник';

    return (
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
          {other.avatarUrl ? (
            <img src={other.avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-base font-semibold text-fg/80">{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-fg">{name}</span>
          <span className="text-xs text-fg/60">Личные сообщения</span>
        </div>
      </div>
    );
  }, [conversation]);

  if (!conversationId) {
    return (
      <div className="glass flex h-full w-full flex-col justify-center rounded-3xl border border-white/15 bg-white/5 p-8 text-center text-sm text-fg/70">
        Выберите чат, чтобы начать переписку.
      </div>
    );
  }

  return (
    <div className="glass flex h-full w-full flex-col rounded-3xl border border-white/15 bg-white/5">
      {header}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <p className="text-sm text-fg/70">Загружаем сообщения…</p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-fg/70">Пока сообщений нет. Напишите первым!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <div key={message.id} className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow transition',
                      isOwn
                        ? 'bg-emerald-600 text-white shadow-emerald-900/20'
                        : 'border border-white/20 bg-white/10 text-fg shadow-slate-900/10'
                    )}
                  >
                    <p className="whitespace-pre-line break-words">{message.text}</p>
                    <div className={cn('mt-2 flex items-center justify-end gap-2 text-xs', isOwn ? 'text-white/70' : 'text-fg/60')}>
                      <span>{formatTime(message.createdAt)}</span>
                      {isOwn && message.readAt && <span>Прочитано</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="border-t border-white/10 px-6 py-4">
        <div className="flex items-end gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? 'Сообщения загружаются…' : 'Напишите сообщение'}
            disabled={!currentUserId || loading || !conversation}
            className="h-20 flex-1 resize-none rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-fg shadow-inner shadow-slate-900/10 focus:border-emerald-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !draft.trim() || !conversation || !currentUserId}
            className={cn(
              'rounded-2xl px-5 py-3 text-sm font-semibold transition',
              sending || !draft.trim() || !conversation || !currentUserId
                ? 'cursor-not-allowed bg-white/10 text-fg/50'
                : 'bg-emerald-500 text-white hover:bg-emerald-400'
            )}
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}
