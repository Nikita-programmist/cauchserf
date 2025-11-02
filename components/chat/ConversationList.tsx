import Link from 'next/link';
import type { ConversationListItem } from '@/lib/chatService';

type ConversationListProps = {
  items: ConversationListItem[];
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
  selectedConversationId,
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
        const isActive = selectedConversationId === item.conversationId;
        const lastMessageTime = item.lastMessageAt
          ? formatter.format(new Date(item.lastMessageAt))
          : null;

        if (!item.conversationId) {
          return (
            <div
              key={item.id}
              className={`flex w-full gap-4 px-5 py-4 text-left transition ${
                isActive
                  ? 'bg-blue-50/90 text-neutral-900 shadow-inner'
                  : 'bg-white/40 text-neutral-800 hover:bg-white/70'
              } cursor-not-allowed opacity-60`}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-200 text-sm font-semibold text-neutral-600">
                {item.otherUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.otherUser.avatarUrl}
                    alt={item.otherUser.name ?? 'Аватар'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getInitials(item.otherUser.name)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {item.otherUser.name ?? 'Без имени'}
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
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={`/chat/${item.conversationId}`}
            className={`flex w-full gap-4 px-5 py-4 text-left transition ${
              isActive
                ? 'bg-blue-50/90 text-neutral-900 shadow-inner'
                : 'bg-white/40 text-neutral-800 hover:bg-white/70'
            }`}
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-200 text-sm font-semibold text-neutral-600">
              {item.otherUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.otherUser.avatarUrl}
                  alt={item.otherUser.name ?? 'Аватар'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{getInitials(item.otherUser.name)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {item.otherUser.name ?? 'Без имени'}
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
          </Link>
        );
      })}
    </div>
  );
}
