import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import ChatPageClient from '@/components/ChatPageClient';
import { listRoomsForUser } from '@/lib/chatService';
import { getCurrentUser } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function ChatPage({
  params,
}: {
  params: { roomId: string };
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login?redirect=/chat');
  }

  const supabase = createServerComponentClient<Database>({ cookies });
  const rooms = await listRoomsForUser(supabase as any, currentUser.id);
  const roomId = params.roomId;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-12 pt-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-fg">Мои диалоги</h1>
          <p className="text-sm text-fg/70">
            Общайтесь с путешественниками и хозяевами в реальном времени.
          </p>
        </div>
      </div>
      <div className="glass-strong flex h-[70vh] flex-col rounded-3xl">
        <ChatPageClient
          currentUserId={currentUser.id}
          initialItems={rooms}
          className="flex-1"
          activeRoomId={roomId}
        />
      </div>
    </div>
  );
}
