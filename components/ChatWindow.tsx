// DEPRECATED: old chat component, use components/chat/ChatWindow.tsx instead
import ChatRoomView from '@/app/chat/[roomId]/ChatRoomView';
import { getChatRoomWithProfiles } from '@/lib/chatRooms';

type ChatWindowProps = {
  roomId: string;
  currentUserId: string;
};

export default async function ChatWindow({ roomId, currentUserId }: ChatWindowProps) {
  const room = await getChatRoomWithProfiles(roomId);

  if (!room) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white/60 px-6 text-center text-sm text-red-500">
        Чат не найден.
      </div>
    );
  }

  const isTraveler = room.traveler_id === currentUserId;
  const isHost = room.host_id === currentUserId;

  if (!isTraveler && !isHost) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white/60 px-6 text-center text-sm text-red-500">
        Вы не являетесь участником этого чата.
      </div>
    );
  }

  const currentUser = isTraveler ? room.traveler : room.host;
  const otherUser = isTraveler ? room.host : room.traveler;

  return <ChatRoomView roomId={roomId} currentUser={currentUser} otherUser={otherUser} />;
}
