'use client';

import { useEffect, useState } from 'react';

type ConversationListProps = {
  onSelect: (conversationId: string) => void;
  selectedConversationId: string | null;
};

type ConversationListItem = {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  lastMessageText: string;
  lastMessageAt: string | null;
};

export default function ConversationList({
  onSelect,
  selectedConversationId,
}: ConversationListProps) {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/conversations', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setItems([]);
        }
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-neutral-500 p-4">
        Загрузка диалогов...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-sm text-neutral-500 p-4">
        Пока нет диалогов.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-200 bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {items.map((item) => {
        const active = item.id === selectedConversationId;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={
              'flex items-start gap-3 p-4 text-left w-full ' +
              (active ? 'bg-blue-50' : 'bg-white hover:bg-neutral-50')
            }
          >
            {/* Аватар / инициалы */}
            <div className="w-10 h-10 rounded-full bg-neutral-300 overflow-hidden flex items-center justify-center text-sm font-medium text-white">
              {item.otherUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.otherUser.avatarUrl}
                  alt={item.otherUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {item.otherUser.name
                    ? item.otherUser.name[0]?.toUpperCase()
                    : '?'}
                </span>
              )}
            </div>

            {/* Текст */}
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-neutral-900 truncate">
                {item.otherUser.name || 'Без имени'}
              </div>
              <div className="text-[13px] text-neutral-600 line-clamp-2 break-words">
                {item.lastMessageText || 'Без сообщения'}
              </div>
              {item.lastMessageAt ? (
                <div className="text-[11px] text-neutral-400 mt-1">
                  {new Date(item.lastMessageAt).toLocaleString()}
                </div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
