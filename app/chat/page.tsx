import { getCurrentUser } from '@/lib/supabaseServer';
import ChatPageClient from '@/components/ChatPageClient';

export default async function ChatPage() {
  const user = await getCurrentUser();

  if (!user) {
    // если хочешь редирект на логин:
    // redirect('/login')
    return (
      <main className="p-4 text-sm text-neutral-500">
        not logged in
      </main>
    );
  }

  return (
    <main className="p-4">
      <ChatPageClient currentUserId={user.id} />
    </main>
  );
}
