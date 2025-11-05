import ChatWindow from '@/components/chat/ChatWindow';
import ConversationList from '@/components/chat/ConversationList';
import type { ConversationListItem } from '@/lib/chatService';
import { cn } from '@/lib/utils';

type ChatPageClientProps = {
  currentUserId: string;
  initialItems: ConversationListItem[];
  className?: string;
  activeConversationId?: string | null;
};

export default function ChatPageClient({
  currentUserId,
  initialItems,
  className,
  activeConversationId,
}: ChatPageClientProps) {
  const firstConversation = initialItems.find((item) => item.conversationId);
  const selectedConversationId = activeConversationId ?? firstConversation?.conversationId ?? null;
  const selectedConversation = initialItems.find(
    (item) => item.conversationId === selectedConversationId
  );

  return (
    <div
      className={cn(
        'flex h-full min-h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-white/70 shadow-inner backdrop-blur',
        className
      )}
    >
      <ConversationList items={initialItems} selectedConversationId={selectedConversationId} />
      <div className="flex flex-1 flex-col">
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId ?? null}
            requestId={selectedConversation?.requestId ?? null}
            currentUserId={currentUserId}
            header={
              selectedConversation ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600">
                    {selectedConversation.otherUser.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedConversation.otherUser.avatarUrl}
                        alt={selectedConversation.otherUser.name ?? 'Собеседник'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        {selectedConversation.otherUser.name?.charAt(0)?.toUpperCase() ?? 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-neutral-900">
                      {selectedConversation.otherUser.name ?? 'Собеседник'}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {selectedConversation.type === 'stay_request'
                        ? 'заявка путешественника'
                        : 'личный диалог'}
                    </span>
                  </div>
                </div>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white/60 text-sm text-neutral-500">
            Выберите чат, чтобы начать переписку
          </div>
        )}
      </div>
    </div>
  );
}
