'use client';

import { useEffect, useState } from 'react';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/ChatWindow';

export default function ChatPageClient({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Автооткрытие первого диалога, чтобы не было пустого экрана
  useEffect(() => {
    (async () => {
      if (activeId) return;
      const res = await fetch('/api/conversations', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const firstConversation = data.find(
          (item: any) => item?.conversationId
        );

        if (firstConversation?.conversationId) {
          setActiveId(firstConversation.conversationId);
        }
      }
    })();
  }, [activeId]);

  return (
    <div className="flex h-[calc(100vh-2rem)] border rounded-lg overflow-hidden bg-white">
      <ConversationList
        onSelect={(id) => setActiveId(id)}
        selectedConversationId={activeId}
      />
      {activeId ? (
        <ChatWindow
          conversationId={activeId}
          currentUserId={currentUserId}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
          Выбери диалог слева
        </div>
      )}
    </div>
  );
}
