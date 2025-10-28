'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import BackToHomeLink from '../../../components/BackToHomeLink';
import { useAuth } from '../../../components/AuthProvider';
import { cn } from '../../../lib/utils';

type ProfilePreview = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  city?: string | null;
};

type ConversationRecord = {
  id: string;
  host_id: string;
  traveler_id: string;
  created_at: string;
  host?: ProfilePreview | null;
  traveler?: ProfilePreview | null;
};

type MessageRecord = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const formatTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const combineName = (profile: ProfilePreview | null | undefined) => {
  if (!profile) return 'Собеседник';
  const firstName = profile.first_name ?? '';
  const lastName = profile.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Собеседник';
};

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationIdParam = params?.conversationId;
  const conversationId = Array.isArray(conversationIdParam)
    ? conversationIdParam[0] ?? ''
    : conversationIdParam ?? '';

  const { supabase, user, loading: authLoading, hasSupabaseEnv } = useAuth();

  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [conversationError, setConversationError] = useState('');
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [messagesError, setMessagesError] = useState('');
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (accessDenied) {
      router.replace('/');
    }
  }, [accessDenied, router]);

  useEffect(() => {
    if (!conversationId || authLoading) {
      return;
    }

    if (!hasSupabaseEnv || !supabase) {
      setConversationError('Подключение к Supabase недоступно.');
      setLoadingConversation(false);
      setLoadingMessages(false);
      return;
    }

    if (!user?.id) {
      return;
    }

    let isActive = true;
    setLoadingConversation(true);
    setConversationError('');
    setAccessDenied(false);

    const loadConversation = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
            id,
            host_id,
            traveler_id,
            created_at,
            host:host_id (
              id,
              first_name,
              last_name,
              city
            ),
            traveler:traveler_id (
              id,
              first_name,
              last_name,
              city
            )
          `
        )
        .eq('id', conversationId)
        .maybeSingle();

      if (!isActive) return;

      if (error) {
        setConversationError(error.message);
        setConversation(null);
        setLoadingConversation(false);
        setLoadingMessages(false);
        return;
      }

      if (!data) {
        setConversationError('Чат не найден.');
        setConversation(null);
        setLoadingConversation(false);
        setLoadingMessages(false);
        return;
      }

      if (data.host_id !== user.id && data.traveler_id !== user.id) {
        setAccessDenied(true);
        setConversation(null);
        setLoadingConversation(false);
        setLoadingMessages(false);
        return;
      }

      setConversation(data as ConversationRecord);
      setLoadingConversation(false);
    };

    loadConversation();

    return () => {
      isActive = false;
    };
  }, [authLoading, conversationId, hasSupabaseEnv, supabase, user]);

  useEffect(() => {
    if (!conversation?.id || !supabase || !user?.id || !hasSupabaseEnv || accessDenied) {
      return;
    }

    let isActive = true;
    setLoadingMessages(true);
    setMessagesError('');

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, body, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (!isActive) return;

      if (error) {
        setMessagesError(error.message);
        setMessages([]);
      } else {
        setMessages((data ?? []) as MessageRecord[]);
      }

      setLoadingMessages(false);
    };

    loadMessages();

    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as MessageRecord | null;
          if (!newMessage) return;

          setMessages((current) => {
            if (current.some((item) => item.id === newMessage.id)) {
              return current;
            }

            return [...current, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      channel.unsubscribe();
    };
  }, [accessDenied, conversation, hasSupabaseEnv, supabase, user?.id]);

  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    const lineHeight = Number.parseInt(window.getComputedStyle(textarea).lineHeight || '20', 10);
    const maxHeight = lineHeight * 3;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [messageText]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const companion = useMemo(() => {
    if (!conversation || !user?.id) return null;
    if (conversation.host_id === user.id) {
      return conversation.traveler ?? null;
    }
    if (conversation.traveler_id === user.id) {
      return conversation.host ?? null;
    }
    return null;
  }, [conversation, user?.id]);

  const companionName = useMemo(() => combineName(companion), [companion]);
  const companionCity = companion?.city ?? '';

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!messageText.trim() || !conversation?.id || !supabase || !user?.id || !hasSupabaseEnv) {
        return;
      }

      setIsSending(true);
      setMessagesError('');

      const body = messageText.trim();

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        body
      });

      if (error) {
        setMessagesError(error.message);
      } else {
        setMessageText('');
      }

      setIsSending(false);
    },
    [conversation?.id, hasSupabaseEnv, messageText, supabase, user?.id]
  );

  const isSubmitDisabled =
    !hasSupabaseEnv ||
    !conversation?.id ||
    !user?.id ||
    !messageText.trim() ||
    isSending ||
    loadingMessages;

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 pb-36 pt-10 sm:pt-16">
      <div className="mb-6 sm:mb-8">
        <BackToHomeLink />
      </div>
      <header className="glass flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 text-sm text-fg/70">
          <span className="text-xs uppercase tracking-[0.3em] text-fg/50">Беседа</span>
          <h1 className="text-xl font-semibold text-fg">{companionName}</h1>
          {companionCity ? <p>{companionCity}</p> : null}
        </div>
      </header>

      {!hasSupabaseEnv ? (
        <section className="glass mt-6 px-6 py-6 text-sm text-fg/70">
          Подключение к Supabase недоступно.
        </section>
      ) : null}

      {conversationError ? (
        <section className="glass mt-6 px-6 py-6 text-sm text-red-400">{conversationError}</section>
      ) : null}

      {loadingConversation ? (
        <section className="glass mt-6 px-6 py-6 text-sm text-fg/70">Загружаем чат…</section>
      ) : null}

      {!loadingConversation && !conversationError && conversation ? (
        <section className="glass mt-6 flex min-h-[320px] flex-1 flex-col gap-4 px-6 py-6">
          <div className="flex-1 overflow-y-auto pr-2">
            {loadingMessages ? (
              <p className="text-sm text-fg/70">Загружаем сообщения…</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-fg/70">Сообщений пока нет. Напишите первым!</p>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div key={message.id} className={cn('mb-4 flex last:mb-0', isOwn ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-lg',
                        isOwn
                          ? 'bg-emerald-500/90 text-white shadow-emerald-900/25'
                          : 'bg-white/10 text-fg shadow-slate-900/10'
                      )}
                    >
                      <p className="whitespace-pre-line break-words">{message.body}</p>
                      <span
                        className={cn(
                          'mt-2 block text-right text-xs',
                          isOwn ? 'text-white/70' : 'text-fg/60'
                        )}
                      >
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          {messagesError ? <p className="text-sm text-red-400">{messagesError}</p> : null}
        </section>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-6 left-1/2 w-full max-w-4xl -translate-x-1/2 px-4"
      >
        <div className="glass flex items-end gap-3 px-5 py-4">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(event) => {
              setMessageText(event.target.value);
              if (messagesError) {
                setMessagesError('');
              }
            }}
            rows={1}
            placeholder="Напишите сообщение…"
            className="max-h-32 min-h-[52px] w-full resize-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-fg placeholder:text-fg/40 focus:border-white/40 focus:outline-none"
            disabled={isSending || loadingConversation || !hasSupabaseEnv || accessDenied}
          />
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center justify-center rounded-full bg-[#003B32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#024f41] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSending ? 'Отправляем…' : 'Отправить'}
          </button>
        </div>
      </form>
    </main>
  );
}
