'use client';

import { useEffect, useMemo, useState } from 'react';
import ChatWindow from '@/components/ChatWindow';
import ConversationList from '@/components/chat/ConversationList';
import type { ChatRoomListItem } from '@/lib/chatRooms';
import { cn } from '@/lib/utils';

type ChatPageClientProps = {
  currentUserId: string;
  initialItems: ChatRoomListItem[];
  className?: string;
};

export default function ChatPageClient({
  currentUserId,
  initialItems,
  className,
}: ChatPageClientProps) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(
    initialItems[0]?.roomId ?? null
  );

  const items = useMemo(() => initialItems, [initialItems]);

  useEffect(() => {
    if (!activeRoomId && items.length > 0) {
      setActiveRoomId(items[0]?.roomId ?? null);
    }
  }, [activeRoomId, items]);

  useEffect(() => {
    if (!activeRoomId) {
      return;
    }
    const stillExists = items.some((item) => item.roomId === activeRoomId);
    if (!stillExists) {
      setActiveRoomId(items[0]?.roomId ?? null);
    }
  }, [activeRoomId, items]);

  return (
    <div
      className={cn(
        'flex h-full min-h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-white/70 shadow-inner backdrop-blur',
        className
      )}
    >
      <ConversationList
        items={items}
        onSelect={setActiveRoomId}
        selectedConversationId={activeRoomId}
      />
      <div className="flex flex-1 flex-col">
        {activeRoomId ? (
          <ChatWindow roomId={activeRoomId} currentUserId={currentUserId} />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white/60 text-sm text-neutral-500">
            Выберите чат, чтобы начать переписку
          </div>
        )}
      </div>
    </div>
  );
}
