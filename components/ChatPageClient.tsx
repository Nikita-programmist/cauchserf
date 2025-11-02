import ChatWindow from '@/components/ChatWindow';
import ConversationList from '@/components/chat/ConversationList';
import type { ChatRoomListItem } from '@/lib/chatRooms';
import { cn } from '@/lib/utils';

type ChatPageClientProps = {
  currentUserId: string;
  initialItems: ChatRoomListItem[];
  className?: string;
  activeRoomId?: string | null;
};

export default function ChatPageClient({
  currentUserId,
  initialItems,
  className,
  activeRoomId,
}: ChatPageClientProps) {
  const selectedRoomId = activeRoomId ?? initialItems[0]?.roomId ?? null;

  return (
    <div
      className={cn(
        'flex h-full min-h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-white/70 shadow-inner backdrop-blur',
        className
      )}
    >
      <ConversationList items={initialItems} selectedConversationId={selectedRoomId} />
      <div className="flex flex-1 flex-col">
        {selectedRoomId ? (
          <ChatWindow roomId={selectedRoomId} currentUserId={currentUserId} />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white/60 text-sm text-neutral-500">
            Выберите чат, чтобы начать переписку
          </div>
        )}
      </div>
    </div>
  );
}
