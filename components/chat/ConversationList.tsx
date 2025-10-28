'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';

type ConversationListItem = {
  id: string;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  otherUser: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  unreadCount: number;
};

type ConversationListProps = {
  onSelect: (conversationId: string) => void;
  selectedConversationId?: string | null;
};

function timeAgo(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return 'только что';
  }
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} мин назад`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} ч назад`;
  }
  return date.toLocaleDateString('ru-RU');
}

export default function ConversationList({ onSelect, selectedConversationId }: ConversationListProps) {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const load = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: 'Не удалось загрузить чаты' }));
          throw new Error(payload.error ?? 'Не удалось загрузить чаты');
        }
        const data = (await response.json()) as ConversationListItem[];
        if (!active) return;
        setItems(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить чаты');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return <p className="px-4 py-6 text-sm text-fg/70">Загружаем чаты…</p>;
    }

    if (error) {
      return (
        <div className="px-4 py-6 text-sm text-red-400">
          <p>{error}</p>
        </div>
      );
    }

    if (items.length === 0) {
      return <p className="px-4 py-6 text-sm text-fg/60">Чатов пока нет.</p>;
    }

    return (
      <ul className="flex flex-col">
        {items.map((item) => {
          const isActive = item.id === selectedConversationId;
          const name = item.otherUser.name ?? 'Без имени';
          const lastMessage = item.lastMessageText?.trim() || 'Нет сообщений';
          const timestamp = timeAgo(item.lastMessageAt);

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition',
                  'hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                  isActive ? 'bg-white/10' : ''
                )}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
                  {item.otherUser.avatarUrl ? (
                    <img src={item.otherUser.avatarUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-fg/80">{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-fg">{name}</p>
                    {timestamp && <span className="text-xs text-fg/60">{timestamp}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-fg/70">
                    <p className="line-clamp-1 flex-1">{lastMessage}</p>
                    {item.unreadCount > 0 && (
                      <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-medium text-white">
                        {item.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }, [error, items, loading, onSelect, selectedConversationId]);

  return <div className="glass h-full w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-white/5">{content}</div>;
}
