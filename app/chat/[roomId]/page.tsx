import { getCurrentUserProfile, listUserChatRooms } from '@/lib/chatRooms';
import ChatRoomView from './[roomId]/ChatRoomView';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const me = await getCurrentUserProfile();
  if (!me) {
    return <div className="p-6">Нужно войти.</div>;
  }

  const rooms = await listUserChatRooms(me.id);
  const activeRoom = rooms[0] ?? null;

  return (
    <div className="p-6 flex gap-6 h-[calc(100vh-120px)]">
      <div className="w-72 bg-white rounded-2xl border overflow-y-auto">
        {rooms.map((r) => (
          <div key={r.roomId} className="px-4 py-3 border-b">
            <div className="font-medium">{r.otherUser.display_name ?? 'Без имени'}</div>
            {r.lastMessageText && (
              <div className="text-sm text-slate-500 truncate">
                {r.lastMessageText}
              </div>
            )}
            {r.unreadCount > 0 && (
              <div className="text-xs text-emerald-600 mt-1">
                {r.unreadCount} непрочитанных
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex-1 bg-white rounded-2xl border p-4">
        {activeRoom ? (
          <ChatRoomView roomId={activeRoom.roomId} />
        ) : (
          <div className="text-slate-400 mt-10">Выберите диалог</div>
        )}
      </div>
    </div>
  );
}

