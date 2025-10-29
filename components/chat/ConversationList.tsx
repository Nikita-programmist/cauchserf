'use client';

import { useCallback, useEffect, useState } from 'react';

type ConversationListProps = {
  onSelect: (conversationId: string) => void;
  selectedConversationId: string | null;
};

type ConversationListItem = {
  id: string;
  type: 'conversation' | 'stay_request';
  conversationId: string | null;
  requestId: string | null;
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  lastMessageText: string;
  lastMessageAt: string | null;
  unreadCount?: number;
};

export default function ConversationList({
  onSelect,
  selectedConversationId,
}: ConversationListProps) {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingChatForId, setCreatingChatForId] = useState<string | null>(
    null
  );

  const loadItems = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/conversations', {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('failed');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (_error) {
      setItems([]);
      setError('Не удалось загрузить список диалогов.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSelect = useCallback(
    async (item: ConversationListItem) => {
      if (creatingChatForId) {
        return;
      }

      if (item.conversationId) {
        onSelect(item.conversationId);
        return;
      }

      if (item.type === 'stay_request' && item.requestId) {
        setCreatingChatForId(item.id);
        setError(null);

        try {
          const res = await fetch(
            `/api/stay-requests/${item.requestId}/ensure-conversation`,
            {
              method: 'POST',
              credentials: 'include',
            }
          );

          if (!res.ok) {
            throw new Error('failed');
          }

          const data = await res.json();

          if (data?.conversationId) {
            await loadItems(true);
            onSelect(data.conversationId);
          }
        } catch (_error) {
          setError('Не получилось создать чат. Попробуйте ещё раз.');
        } finally {
          setCreatingChatForId(null);
        }
      }
    },
    [creatingChatForId, loadItems, onSelect]
  );

  if (loading) {
    return (
      <div className="text-sm text-neutral-500 p-4">
        Загрузка диалогов...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-sm p-4">
        {error ? (
          <span className="text-red-500">{error}</span>
        ) : (
          <span className="text-neutral-500">Пока нет диалогов.</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-200 bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {error ? (
        <div className="px-4 py-2 text-xs text-red-500 bg-red-50">
          {error}
        </div>
      ) : null}
      {items.map((item) => {
        const active = item.conversationId
          ? item.conversationId === selectedConversationId
          : creatingChatForId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item)}
            disabled={creatingChatForId === item.id}
            className={
              'flex items-start gap-3 p-4 text-left w-full transition ' +
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
              <div className="flex items-center gap-2 text-[11px] text-blue-600">
                {item.type === 'stay_request' && !item.conversationId ? (
                  <span>Заявка без чата</span>
                ) : null}
                {creatingChatForId === item.id ? (
                  <span>Создаём чат…</span>
                ) : null}
              </div>
              <div className="text-[13px] text-neutral-600 line-clamp-2 break-words">
                {item.lastMessageText || 'Без сообщения'}
              </div>
              {item.lastMessageAt ? (
                <div className="text-[11px] text-neutral-400 mt-1">
                  {new Date(item.lastMessageAt).toLocaleString()}
                </div>
              ) : null}
              {item.unreadCount && item.unreadCount > 0 ? (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-600">
                  <span>Непрочитанные:</span>
                  <span>{item.unreadCount}</span>
                </div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
