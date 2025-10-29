
'use client';

import { useEffect, useState } from 'react';

function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return diffMin + 'm';
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return diffH + 'h';
  const diffD = Math.floor(diffH / 24);
  return diffD + 'd';
}

export default function ConversationList({
  onSelect,
}: {
  onSelect: (conversationId: string) => void;
}) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/conversations', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    })();
  }, []);

  return (
    <div className="flex flex-col border-r w-64 max-w-64 overflow-y-auto bg-white">
      {items.map((conv) => (
        <button
          key={conv.id}
          className="flex items-start gap-2 p-3 text-left hover:bg-neutral-100 border-b w-full"
          onClick={() => onSelect(conv.id)}
        >
          <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center overflow-hidden text-sm font-semibold">
            {conv.otherUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conv.otherUser.avatarUrl}
                alt={conv.otherUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{conv.otherUser.name?.[0] ?? 'U'}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-sm font-medium">
              <span className="truncate">{conv.otherUser.name}</span>
              <span className="text-[11px] text-neutral-500">
                {timeAgo(conv.lastMessageAt)}
              </span>
            </div>

            <div className="text-xs text-neutral-600 flex items-center gap-2">
              <span className="truncate">
                {conv.lastMessageText || '...'}
              </span>
              {conv.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
