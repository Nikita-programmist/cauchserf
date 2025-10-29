'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRealtimeConversation } from '@/hooks/useRealtimeConversation';

type ChatData = {
  conversationId: string;
  me: { id: string; name: string; avatarUrl: string | null };
  otherUser: { id: string; name: string; avatarUrl: string | null };
  messages: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    readAt: string | null;
  }[];
};

export default function ChatWindow({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [chat, setChat] = useState<ChatData | null>(null);
  const [messageText, setMessageText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // грузим историю чата
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      setChat(data);

      // сразу помечаем входящие как прочитанные
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
    })();
  }, [conversationId]);

  // автоскролл вниз при сообщениях
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  // новое сообщение по realtime INSERT
  const handleNewMessage = useCallback((row: any) => {
    setChat((prev) => {
      if (!prev) return prev;
      if (prev.messages.find((m) => m.id === row.id)) return prev;
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: row.id,
            senderId: row.sender_id,
            text: row.text,
            createdAt: row.created_at,
            readAt: row.read_at,
          },
        ],
      };
    });
  }, []);

  // апдейт read_at по realtime UPDATE
  const handleUpdateMessage = useCallback((row: any) => {
    setChat((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === row.id
            ? { ...m, readAt: row.read_at }
            : m
        ),
      };
    });
  }, []);

  // подписка на realtime
  useRealtimeConversation(
    conversationId,
    handleNewMessage,
    handleUpdateMessage
  );

  // отправка сообщения
  async function send() {
    const txt = messageText.trim();
    if (!txt || !chat) return;

    // оптимистично пихаем сообщение в стейт
    const tempId = 'local-' + Date.now().toString();
    const optimisticMsg = {
      id: tempId,
      senderId: currentUserId,
      text: txt,
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    setChat((prev) =>
      prev
        ? { ...prev, messages: [...prev.messages, optimisticMsg] }
        : prev
    );
    setMessageText('');

    // шлём на наш API
    const res = await fetch(
      `/api/conversations/${conversationId}/send`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: txt }),
      }
    );
    const realMsg = await res.json();

    // заменяем временный id на реальный
    setChat((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === tempId
            ? {
                ...m,
                id: realMsg.id,
                createdAt: realMsg.createdAt,
              }
            : m
        ),
      };
    });

    // снова помечаем входящее как прочитанное
    await fetch(`/api/conversations/${conversationId}/read`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        Загрузка чата...
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-white">
      {/* Хедер */}
      <div className="flex items-center gap-2 p-3 border-b bg-white">
        <div className="w-10 h-10 rounded-full bg-neutral-300 overflow-hidden flex items-center justify-center text-sm font-semibold">
          {chat.otherUser.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={chat.otherUser.avatarUrl}
              alt={chat.otherUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{chat.otherUser.name?.[0] ?? 'U'}</span>
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-semibold">
            {chat.otherUser.name}
          </div>
          <div className="text-[11px] text-neutral-500">
            приватный диалог
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-neutral-50">
        {chat.messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                  mine
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border text-neutral-900'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {m.text}
                </div>
                <div className="text-[10px] opacity-60 mt-1 text-right">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {mine && m.readAt ? ' • seen' : ''}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Инпут */}
      <div className="border-t p-3 flex gap-2 bg-white">
        <textarea
          className="flex-1 resize-none rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
          placeholder="Напиши сообщение..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          onClick={send}
          className="bg-blue-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
