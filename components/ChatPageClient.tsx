import ChatWindow from '@/components/chat/ChatWindow';
import ConversationList from '@/components/chat/ConversationList';
import type { RoomListItem } from '@/lib/chatService';
import { cn } from '@/lib/utils';

type ChatPageClientProps = {
  currentUserId: string;
  initialItems: RoomListItem[];
  className?: string;
  activeRoomId?: string | null;
};

export default function ChatPageClient({
  currentUserId,
  initialItems,
  className,
  activeRoomId,
}: ChatPageClientProps) {
  const firstRoom = initialItems.find((item) => item.roomId);
  const selectedRoomId = activeRoomId ?? firstRoom?.roomId ?? null;
  const selectedRoom = initialItems.find((item) => item.roomId === selectedRoomId);
  const primaryPeer = selectedRoom?.peers?.[0] ?? null;

  return (
    <div
      className={cn(
        'flex h-full min-h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-white/70 shadow-inner backdrop-blur',
        className
      )}
    >
      <ConversationList items={initialItems} selectedRoomId={selectedRoomId} />
      <div className="flex flex-1 flex-col">
        {selectedRoomId ? (
          <ChatWindow
            roomId={selectedRoomId ?? null}
            currentUserId={currentUserId}
            header={
              selectedRoom && primaryPeer ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600">
                    {primaryPeer.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={primaryPeer.avatarUrl}
                        alt={primaryPeer.name ?? 'Собеседник'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        {primaryPeer.name?.charAt(0)?.toUpperCase() ?? 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-neutral-900">
                      {primaryPeer.name ?? 'Собеседник'}
                    </span>
                  </div>
                </div>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white/60 text-sm text-neutral-500">
            Выберите чат, чтобы начать переписку
          </div>
        )}
      </div>
    </div>
  );
}
