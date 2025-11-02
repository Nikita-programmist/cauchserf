'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatRoom } from '@/hooks/useChatRoom';
import type { ProfileSummary } from '@/lib/chatRooms';

type ChatRoomViewProps = {
  roomId: string;
  currentUser: ProfileSummary;
  otherUser: ProfileSummary;
};

export default function ChatRoomView({ roomId, currentUser, otherUser }: ChatRoomViewProps) {
  const { messages, sendMessage, editMessage, deleteMessage, isSending } = useChatRoom(roomId);
  const [draft, setDraft] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!editingMessageId) return;
    const current = messages.find((msg) => msg.id === editingMessageId);
    if (!current || current.deleted_at) {
      setEditingMessageId(null);
      setDraft('');
    }
  }, [editingMessageId, messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;

    try {
      if (editingMessageId) {
        await editMessage(editingMessageId, text);
        setEditingMessageId(null);
        setDraft('');
      } else {
        await sendMessage(text);
        setDraft('');
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleCancelEdit() {
    setEditingMessageId(null);
    setDraft('');
  }

  async function handleDelete(messageId: string) {
    try {
      await deleteMessage(messageId);
      if (editingMessageId === messageId) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setMenuMessageId(null);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function Avatar({ profile }: { profile: ProfileSummary }) {
    const initials = (profile.display_name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');

    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-200 text-xs font-semibold text-neutral-700">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.display_name ?? 'Аватар'}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials || '❖'}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col gap-4 bg-transparent p-4">
      {/* header */}
      <header className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/70 px-4 py-3 shadow-inner backdrop-blur">
        <Avatar profile={otherUser} />
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-neutral-900">
            {otherUser.display_name || 'Без имени'}
          </div>
          <div className="text-[11px] text-neutral-500">Не в сети</div>
        </div>
      </header>

      {/* messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/15 bg-white/80 p-4 shadow-inner">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-center text-sm text-neutral-400">
            Пока нет сообщений. Напишите первым.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUser.id;
            const isDeleted = Boolean(m.deleted_at);

            if (isDeleted) {
              return (
                <div key={m.id} className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%] rounded-xl bg-neutral-100 px-3 py-2 text-sm italic text-neutral-400">
                    Сообщение удалено
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`relative max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    mine ? 'bg-blue-500 text-white' : 'bg-neutral-100 text-neutral-900'
                  }`}
                >
                  {mine ? (
                    <div className="absolute -top-2 -right-2 flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => setMenuMessageId((prev) => (prev === m.id ? null : m.id))}
                        className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-neutral-700 shadow transition hover:bg-white"
                      >
                        ⋯
                      </button>
                      {menuMessageId === m.id ? (
                        <div className="w-28 rounded-lg border border-neutral-200 bg-white py-1 text-left text-[11px] text-neutral-700 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(m.id);
                              setDraft(m.body);
                              setMenuMessageId(null);
                            }}
                            className="flex w-full items-center px-3 py-1.5 text-left hover:bg-neutral-100"
                          >
                            Редактировать
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(m.id)}
                            className="flex w-full items-center px-3 py-1.5 text-left text-red-600 hover:bg-red-50"
                          >
                            Удалить
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="whitespace-pre-wrap break-words">{m.body}</div>

                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                    {m.edited_at ? <span>(изменено)</span> : null}
                    <span>
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/70 px-4 py-3 shadow-inner backdrop-blur">
        {editingMessageId ? (
          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            <span>Редактирование сообщения</span>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="font-medium text-blue-600 transition hover:text-blue-700"
            >
              Отмена
            </button>
          </div>
        ) : null}
        <textarea
          className="min-h-[44px] w-full resize-none rounded-lg border border-neutral-300 bg-white/90 p-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          rows={1}
          placeholder={editingMessageId ? 'Измените сообщение…' : 'Напишите сообщение…'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="flex justify-end gap-2">
          {editingMessageId ? (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
            >
              Отмена
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !draft.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {editingMessageId ? 'Сохранить' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}
