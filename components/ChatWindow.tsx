'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useRealtimeConversation } from '@/hooks/useRealtimeConversation';

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

type Message = ConversationPayload['messages'][number] & {
  optimistic?: boolean;
};

type Props = {
  conversationId: string | null;
  currentUserId: string;
};

async function markRead(conversationId: string) {
  await fetch(`/api/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  }).catch(() => undefined);
}

export default function ChatWindow({ conversationId, currentUserId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationPayload | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const otherUser = conversation?.otherUser ?? null;

  const dispatchConversationUpdate = useCallback(
    (lastMessageText: string, lastMessageAt: string, unreadCount: number) => {
      if (!conversationId || typeof window === 'undefined') return;
      window.dispatchEvent(
        new CustomEvent('conversation:update', {
          detail: {
            conversationId,
            lastMessageText,
            lastMessageAt,
            unreadCount
          }
        })
      );
    },
    [conversationId]
  );

  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: 'Failed to load conversation' }));
        throw new Error(payload.error ?? 'Failed to load conversation');
      }
      const data = (await res.json()) as ConversationPayload;
      setConversation(data);
      setMessages(data.messages);
      setSendError(null);
      const last = data.messages[data.messages.length - 1];
      if (last) {
        dispatchConversationUpdate(last.text, last.createdAt, 0);
      }
      await markRead(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
      setConversation(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, dispatchConversationUpdate]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  const handleRealtimeInsert = useCallback(
    (payload: { id: string; senderId: string; text: string; createdAt: string; readAt: string | null }) => {
      setMessages((prev) => {
        const existing = prev.find((message) => message.id === payload.id);
        if (existing) {
          return prev.map((message) =>
            message.id === payload.id
              ? { ...message, readAt: payload.readAt, text: payload.text, createdAt: payload.createdAt, optimistic: false }
              : message
          );
        }

        const withoutLocal = prev.filter(
          (message) => !(message.optimistic && message.senderId === payload.senderId && message.text === payload.text)
        );
        const next = [...withoutLocal, { ...payload }];
        next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return next;
      });

      if (payload.senderId !== currentUserId && conversationId) {
        void markRead(conversationId);
      }

      dispatchConversationUpdate(payload.text, payload.createdAt, payload.senderId === currentUserId ? 0 : 0);
    },
    [conversationId, currentUserId, dispatchConversationUpdate]
  );

  const handleRealtimeUpdate = useCallback(
    (payload: { id: string; senderId: string; text: string; createdAt: string; readAt: string | null }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === payload.id
            ? { ...message, readAt: payload.readAt, text: payload.text, createdAt: payload.createdAt, optimistic: false }
            : message
        )
      );
    },
    []
  );

  useRealtimeConversation(conversationId, handleRealtimeInsert, handleRealtimeUpdate);

  useEffect(() => {
    if (!conversationId) {
      setMessageText('');
    }
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageHandler = useCallback(async () => {
    if (!conversationId || !messageText.trim()) {
      return;
    }
    const trimmed = messageText.trim();
    setMessageText('');
    setSendError(null);

    const localId = `local-${Date.now()}`;
    const optimisticMessage: Message = {
      id: localId,
      senderId: currentUserId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      readAt: null,
      optimistic: true
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ text: trimmed })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(payload.error ?? 'Failed to send message');
      }

      const saved = (await res.json()) as Message;
      setMessages((prev) => {
        const filtered = prev.filter((message) => message.id !== localId);
        const exists = filtered.some((message) => message.id === saved.id);
        if (exists) {
          return filtered.map((message) =>
            message.id === saved.id
              ? { ...message, text: saved.text, createdAt: saved.createdAt, readAt: saved.readAt, optimistic: false }
              : message
          );
        }
        return [...filtered, { ...saved, optimistic: false }];
      });
      await markRead(conversationId);
      dispatchConversationUpdate(saved.text, saved.createdAt, 0);
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.id !== localId));
      setMessageText(trimmed);
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [conversationId, currentUserId, dispatchConversationUpdate, messageText]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void sendMessageHandler();
      }
    },
    [sendMessageHandler]
  );

  const header = useMemo(() => {
    if (!otherUser) {
      return <div className="p-4 text-sm text-neutral-500">Выбери диалог слева</div>;
    }

    return (
      <div className="flex items-center gap-3 border-b border-neutral-200 p-4">
        <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600">
          {otherUser.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherUser.avatarUrl} alt={otherUser.name ?? 'User avatar'} className="h-full w-full object-cover" />
          ) : (
            <span>{(otherUser.name ?? 'U').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">{otherUser.name ?? 'Пользователь'}</p>
          <p className="text-xs text-neutral-500">Личные сообщения</p>
        </div>
      </div>
    );
  }, [otherUser]);

  if (!conversationId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Выбери диалог слева</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        {header}
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">Загрузка…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        {header}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={() => fetchConversation()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      {header}
      <div className="flex-1 overflow-y-auto bg-neutral-50 p-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {messages.map((message) => {
            const isMine = message.senderId === currentUserId;
            const timestamp = new Date(message.createdAt);
            const timeLabel = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={message.id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow ${
                    isMine ? 'bg-blue-600 text-white' : 'bg-white text-neutral-800 border border-neutral-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-2 text-xs opacity-70">
                    <span>{timeLabel}</span>
                    {isMine && message.readAt && <span>• seen</span>}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="border-t border-neutral-200 bg-white p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <textarea
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение"
            className="h-20 w-full resize-none rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={() => void sendMessageHandler()}
            className="flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!messageText.trim()}
          >
            Отправить
          </button>
        </div>
        {sendError && <p className="mx-auto mt-2 max-w-3xl text-sm text-red-500">{sendError}</p>}
      </div>
    </div>
  );
}
