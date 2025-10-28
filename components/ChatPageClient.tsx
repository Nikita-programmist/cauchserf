'use client';

import { useEffect, useState } from 'react';
import ChatWindow from '@/components/ChatWindow';
import ConversationList from '@/components/ConversationList';

type Props = {
  currentUserId: string;
};

type ConversationSummary = {
  id: string;
};

export default function ChatPageClient({ currentUserId }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/conversations', { credentials: 'include' });
        if (!res.ok) return;
        const data = (await res.json()) as ConversationSummary[];
        if (!mounted) return;
        if (data.length > 0) {
          setActiveId((prev) => prev ?? data[0].id);
        }
      } catch (error) {
        // swallow error silently; list component handles messaging
        console.error('Failed to preselect conversation', error);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-2rem)] overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="w-64 max-w-64 flex-none bg-white">
        <ConversationList
          onSelect={(conversationId) => {
            setActiveId(conversationId);
          }}
        />
      </div>
      <div className="flex flex-1 bg-neutral-50">
        {activeId ? (
          <ChatWindow conversationId={activeId} currentUserId={currentUserId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">Выбери диалог слева</div>
        )}
      </div>
    </div>
  );
}
