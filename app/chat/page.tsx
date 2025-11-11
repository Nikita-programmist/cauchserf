import { redirect } from 'next/navigation';
import ChatPageClient from '@/components/ChatPageClient';
import { listConversationsForUser } from '@/lib/chatService';
import { getCurrentUser } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export default async function ChatIndexPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login?redirect=/chat');
  }

  const conversations = await listConversationsForUser(currentUser.id);

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
          initialItems={conversations}
          className="flex-1"
        />
      </div>
    </div>
  );
}
