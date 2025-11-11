import Link from 'next/link';

import type { RoomListItem } from '@/lib/chatService';

type ConversationListProps = {
  items: RoomListItem[];
  selectedRoomId: string | null;
};

function getInitials(name: string | null | undefined) {
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
  selectedRoomId,
}: ConversationListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-sm text-neutral-500">
        Пока нет диалогов.
      </div>
    );
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex w-80 flex-col overflow-y-auto border-r border-white/10 bg-white/30">
      {items.map((item) => {
        if (!item.roomId) {
          return null;
        }

        const isActive = selectedRoomId === item.roomId;
        const lastMessageTime = item.lastMessageAt
          ? formatter.format(new Date(item.lastMessageAt))
          : null;
        const primaryPeer = item.peers?.[0] ?? null;

        return (
          <Link
            key={item.id}
            href={`/chat/${item.roomId}`}
            className={`flex w-full gap-4 px-5 py-4 text-left transition ${
              isActive
                ? 'bg-blue-50/90 text-neutral-900 shadow-inner'
                : 'bg-white/40 text-neutral-800 hover:bg-white/70'
            }`}
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-200 text-sm font-semibold text-neutral-600">
              {primaryPeer?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryPeer.avatarUrl}
                  alt={primaryPeer.name ?? 'Аватар'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{getInitials(primaryPeer?.name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {primaryPeer?.name ?? 'Без имени'}
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
            </div>
          </Link>
        );
      })}
    </div>
  );
}
