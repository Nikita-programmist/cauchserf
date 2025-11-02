'use client';

import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth } from '@/components/AuthProvider';

export default function ChatRoomView({ roomId }: { roomId: string }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
        Авторизуйтесь, чтобы переписываться.
      </div>
    );
  }

  return <ChatWindow conversationId={roomId} currentUserId={user.id} />;
}
