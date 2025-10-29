// app/chat/[roomId]/page.tsx
import { redirect } from 'next/navigation';
import ChatWindow from '@/components/ChatWindow';
import { getCurrentUserProfile } from '@/lib/chatRooms';

export default async function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const currentUser = await getCurrentUserProfile();
  if (!currentUser) {
    redirect(`/login?redirect=/chat/${params.roomId}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <ChatWindow roomId={params.roomId} currentUserId={currentUser.id} />
    </div>
  );
}
