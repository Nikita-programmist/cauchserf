'use client';

import type { User } from '@supabase/supabase-js';
import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth } from '@/components/AuthProvider';

export default function ChatRoomView({
  conversationId,
}: {
  conversationId: string;
}) {
  const { user } = useAuth() as { user: User | null };

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
        Авторизуйтесь, чтобы переписываться.
      </div>
    );
  }

  return <ChatWindow conversationId={conversationId} currentUserId={user.id} />;
}
