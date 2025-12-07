import ChatPageClient from '@/components/ChatPageClient';

export const dynamic = 'force-dynamic';

export default function ChatRoomPage({ params }: { params: { roomId: string } }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-12 pt-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-fg">Диалог</h1>
          <p className="text-sm text-fg/70">
            Просматривайте переписку и продолжайте общение.
          </p>
        </div>
      </div>
      <div className="glass-strong flex h-[70vh] flex-col rounded-3xl">
        <ChatPageClient className="flex-1" activeRoomId={params.roomId} />
      </div>
    </div>
  );
}
