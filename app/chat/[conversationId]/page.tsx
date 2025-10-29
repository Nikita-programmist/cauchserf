
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import BackToHomeLink from '../../../components/BackToHomeLink';
import { useAuth } from '../../../components/AuthProvider';
import ConversationList from '../../../components/chat/ConversationList';
import ChatWindow from '../../../components/chat/ChatWindow';

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();

  const { user, loading: authLoading } = useAuth() as {
    user: { id?: string | null } | null;
    loading: boolean;
  };

  // берём conversationId из URL
  const conversationIdParam = params?.conversationId;
  const initialConversationId = useMemo(() => {
    const raw = Array.isArray(conversationIdParam)
      ? conversationIdParam[0]
      : conversationIdParam;
    return raw && typeof raw === 'string' ? raw : null;
  }, [conversationIdParam]);

  // текущая выбранная беседа
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId
  );

  // синхронизируем стейт, если меняется URL
  useEffect(() => {
    setSelectedConversationId(initialConversationId);
  }, [initialConversationId]);

  // если не залогинен → улетаем на /login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, router, user]);

  // когда выбираешь беседу в списке слева
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    router.push(`/chat/${conversationId}`);
  };

  // UI
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 lg:flex-row lg:gap-8">
      {/* Левая колонка (список чатов) */}
      <div className="lg:w-72 xl:w-80">
        <BackToHomeLink className="text-sm text-fg/80" />

        <h1 className="mt-6 text-2xl font-semibold text-fg">Сообщения</h1>
        <p className="mt-2 text-sm text-fg/70">
          Общайтесь с путешественниками и хозяевами в одном месте
        </p>

        <div className="mt-6">
          <ConversationList
            onSelect={handleSelectConversation}
            selectedConversationId={selectedConversationId}
          />
        </div>
      </div>

      {/* Правая колонка (окно диалога или заглушка) */}
      {(!user?.id || !selectedConversationId) ? (
        <div className="flex min-h-[500px] flex-1 items-center justify-center text-neutral-500">
          Чат не выбран
        </div>
      ) : (
        <div className="flex min-h-[500px] flex-1">
          <ChatWindow
            conversationId={selectedConversationId}
            currentUserId={user.id}
          />
        </div>
      )}
    </div>
  );
}
