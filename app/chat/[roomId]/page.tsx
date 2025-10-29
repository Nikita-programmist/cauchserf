import { redirect } from 'next/navigation';
import { getChatRoomWithProfiles, getCurrentUserProfile } from '@/lib/chatRooms';
import ChatRoomView from './ChatRoomView';

type PageProps = {
  params: {
    roomId: string;
  };
};

export default async function ChatRoomPage({ params }: PageProps) {
  const { roomId } = params;
  const currentProfile = await getCurrentUserProfile();

  if (!currentProfile) {
    redirect(`/login?redirect=/chat/${roomId}`);
  }

  const room = await getChatRoomWithProfiles(roomId);

  if (!room) {
    redirect('/chat');
  }

  const participantIds = [room.traveler_id, room.host_id];
  if (!participantIds.includes(currentProfile.id)) {
    redirect('/chat');
  }

  const otherProfile =
    room.traveler_id === currentProfile.id ? room.host : room.traveler;

  return (
    <ChatRoomView
      roomId={room.id}
      currentUser={currentProfile}
      otherUser={otherProfile}
    />
  );
}
