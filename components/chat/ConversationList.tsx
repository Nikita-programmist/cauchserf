'use client';

import type { ChatRoomListItem } from '@/lib/chatRooms';
import { useMemo } from 'react';

type ConversationListProps = {
  items: ChatRoomListItem[];
  onSelect: (roomId: string) => void;
  selectedConversationId: string | null;
};

function getInitials(name: string | null) {
  if (!name) return '❖';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '❖';
  if (parts.length === 1) {
    return parts[0]?.[0]?.toUpperCase() ?? '❖';
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export default function ConversationList({
  items,
  onSelect,
  selectedConversationId,
}: ConversationListProps) {
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-sm text-neutral-500">
        Пока нет диалогов.
      </div>
    );
  }

  return (
    <div className="flex w-80 flex-col overflow-y-auto border-r border-white/10 bg-white/30">
      {items.map((item) => {
        const isActive = selectedConversationId === item.roomId;
        const lastMessageTime = item.lastMessageAt
          ? formatter.format(new Date(item.lastMessageAt))
          : null;

        return (
          <button
            key={item.roomId}
            onClick={() => onSelect(item.roomId)}
            className={`flex w-full gap-4 px-5 py-4 text-left transition ${
              isActive
                ? 'bg-blue-50/90 text-neutral-900 shadow-inner'
                : 'bg-white/40 text-neutral-800 hover:bg-white/70'
            }`}
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-200 text-sm font-semibold text-neutral-600">
              {item.otherUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.otherUser.avatar_url}
                  alt={item.otherUser.display_name ?? 'Аватар'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{getInitials(item.otherUser.display_name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {item.otherUser.display_name ?? 'Без имени'}
                </p>
                {lastMessageTime ? (
                  <span className="flex-shrink-0 text-[11px] text-neutral-500">
                    {lastMessageTime}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                {item.lastMessageText || 'Нет сообщений'}
              </p>
              {item.unreadCount > 0 ? (
                <span className="mt-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                  {item.unreadCount} непрочитанных
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
