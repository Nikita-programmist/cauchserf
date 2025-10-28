import ChatPageClient from '@/components/ChatPageClient';
import { getCurrentUser } from '@/lib/supabaseServer';

export default async function ChatPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="p-4">
        <p className="text-sm text-neutral-500">Для просмотра сообщений необходимо войти.</p>
      </main>
    );
  }

  return (
    <main className="p-4">
      <ChatPageClient currentUserId={user.id} />
    </main>
  );
}
