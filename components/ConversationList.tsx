'use client';

import { useEffect, useMemo, useState } from 'react';

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

type Props = {
  onSelect: (conversationId: string) => void;
};

function timeAgo(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return 'just now';
  }
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}m ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h ago`;
  }

  return date.toLocaleDateString();
}

export default function ConversationList({ onSelect }: Props) {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/conversations', { credentials: 'include' });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({ error: 'Failed to load conversations' }));
          throw new Error(payload.error ?? 'Failed to load conversations');
        }
        const data = (await res.json()) as ConversationListItem[];
        if (!active) return;
        setItems(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    fetchConversations();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedId) return;
    if (items.length === 0) return;
    setSelectedId(items[0].id);
    onSelect(items[0].id);
  }, [items, onSelect, selectedId]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        conversationId: string;
        lastMessageText: string;
        lastMessageAt: string;
        unreadCount: number;
      }>;
      const detail = customEvent.detail;
      if (!detail) return;
      setItems((prev) => {
        const index = prev.findIndex((item) => item.id === detail.conversationId);
        if (index === -1) {
          return prev;
        }
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lastMessageText: detail.lastMessageText,
          lastMessageAt: detail.lastMessageAt,
          unreadCount: detail.unreadCount
        };
        return updated;
      });
    };

    window.addEventListener('conversation:update', handler);

    return () => {
      window.removeEventListener('conversation:update', handler);
    };
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return <div className="p-4 text-sm text-neutral-500">Loading…</div>;
    }

    if (error) {
      return (
        <div className="p-4 text-sm text-red-500">
          <p>{error}</p>
        </div>
      );
    }

    if (items.length === 0) {
      return <div className="p-4 text-sm text-neutral-500">No conversations yet.</div>;
    }

    return (
      <ul className="flex flex-col">
        {items.map((item) => {
          const isActive = selectedId === item.id;
          const displayName = item.otherUser.name ?? 'Unknown user';
          const preview = item.lastMessageText?.trim() || 'No messages yet';
          const timestamp = timeAgo(item.lastMessageAt);

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(item.id);
                  onSelect(item.id);
                  setItems((prev) =>
                    prev.map((conv) =>
                      conv.id === item.id
                        ? {
                            ...conv,
                            unreadCount: 0
                          }
                        : conv
                    )
                  );
                }}
                className={`flex w-full items-start gap-3 border-b border-neutral-200 p-3 text-left transition hover:bg-neutral-100 ${
                  isActive ? 'bg-neutral-100' : ''
                }`}
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600">
                  {item.otherUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.otherUser.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
                    {timestamp && <span className="text-xs text-neutral-500">{timestamp}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <p className="line-clamp-1 flex-1 text-neutral-600">{preview}</p>
                    {item.unreadCount > 0 && (
                      <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
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
  }, [error, items, loading, onSelect, selectedId]);

  return <div className="flex h-full max-h-full flex-col border-r border-neutral-200 bg-white">{content}</div>;
}
