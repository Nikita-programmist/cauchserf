import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../components/AuthProvider';
import BackToHomeLink from '../../components/BackToHomeLink';
import ChatInput from '../../components/ChatInput';
import ChatMessageList from '../../components/ChatMessageList';

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const combineName = (profile) => {
  if (!profile) return 'Собеседник';
  const firstName = profile.first_name ?? '';
  const lastName = profile.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Собеседник';
};

export default function ConversationPage() {
  const router = useRouter();
  const { conversationId } = router.query;
  const { supabase, user, loading: authLoading, hasSupabaseEnv } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState('');
  const [messagesError, setMessagesError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!conversationId || authLoading) {
      return;
    }

    if (!hasSupabaseEnv || !supabase) {
      setLoadingConversation(false);
      setLoadingMessages(false);
      return;
    }

    if (!user?.id) {
      return;
    }

    let active = true;
    setLoadingConversation(true);
    setAccessDenied(false);
    setError('');

    const loadConversation = async () => {
      const { data, error: conversationError } = await supabase
        .from('conversations')
        .select(
          `
            id,
            host_id,
            traveler_id,
            listing_id,
            created_at,
            host:host_id (
              id,
              first_name,
              last_name,
              avatar_url,
              city
            ),
            traveler:traveler_id (
              id,
              first_name,
              last_name,
              avatar_url,
              city
            )
          `
        )
        .eq('id', conversationId)
        .maybeSingle();

      if (!active) return;

      if (conversationError) {
        setError(conversationError.message);
        setConversation(null);
        setLoadingConversation(false);
        setLoadingMessages(false);
        return;
      }

      if (!data || (data.host_id !== user.id && data.traveler_id !== user.id)) {
        setAccessDenied(true);
        setConversation(null);
        setLoadingConversation(false);
        setLoadingMessages(false);
        return;
      }

      setConversation(data);
      setLoadingConversation(false);
    };

    loadConversation();

    return () => {
      active = false;
    };
  }, [conversationId, supabase, user, authLoading, hasSupabaseEnv]);

  useEffect(() => {
    if (!conversation?.id || !supabase || !user?.id || !hasSupabaseEnv || accessDenied) {
      return;
    }

    let active = true;
    setLoadingMessages(true);
    setMessagesError('');

    const loadMessages = async () => {
      const { data, error: messagesLoadError } = await supabase
        .from('messages')
        .select(
          `
            id,
            text,
            created_at,
            sender_id,
            sender:sender_id (
              id,
              first_name,
              last_name,
              avatar_url,
              role
            )
          `
        )
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (!active) return;

      if (messagesLoadError) {
        setMessagesError(messagesLoadError.message);
        setMessages([]);
      } else {
        const normalized = (data ?? []).map((item) => ({
          id: item.id,
          text: item.text,
          created_at: item.created_at,
          sender_id: item.sender_id,
          sender: item.sender ?? null
        }));
        setMessages(normalized);
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
          const newMessage = payload.new;
          if (!newMessage) return;

          setMessages((current) => {
            if (current.some((item) => item.id === newMessage.id)) {
              return current;
            }

            const senderProfile =
              conversation?.host?.id === newMessage.sender_id
                ? conversation.host
                : conversation?.traveler?.id === newMessage.sender_id
                  ? conversation.traveler
                  : null;

            return [
              ...current,
              {
                id: newMessage.id,
                text: newMessage.text,
                created_at: newMessage.created_at,
                sender_id: newMessage.sender_id,
                sender: senderProfile
              }
            ];
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      channel?.unsubscribe();
    };
  }, [conversation, supabase, user, hasSupabaseEnv, accessDenied]);

  const companion = useMemo(() => {
    if (!conversation || !user?.id) return null;
    if (conversation.host_id === user.id) {
      return conversation.traveler ?? null;
    }
    if (conversation.traveler_id === user.id) {
      return conversation.host ?? null;
    }
    return null;
  }, [conversation, user]);

  const companionName = useMemo(() => combineName(companion), [companion]);
  const companionCity = companion?.city ?? '';
  const companionAvatar = companion?.avatar_url ?? '';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!messageText.trim() || !conversation?.id || !supabase || !user?.id) {
      return;
    }

    setIsSending(true);
    setMessagesError('');

    const text = messageText.trim();

    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      text
    });

    if (insertError) {
      setMessagesError(insertError.message);
    } else {
      setMessageText('');
    }

    setIsSending(false);
  };

  const pageTitle = conversation ? `Чат — ${companionName}` : 'Чат';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-4xl flex-col gap-6 px-6 pb-16">
        <BackToHomeLink className="self-start" />
        {!hasSupabaseEnv ? (
          <section className="glass px-8 py-10 text-sm text-fg/70">
            Подключение к Supabase недоступно.
          </section>
        ) : null}
        {error ? (
          <section className="glass px-8 py-10 text-sm text-red-400">{error}</section>
        ) : null}
        {accessDenied ? (
          <section className="glass flex flex-col gap-3 px-8 py-10 text-center">
            <p className="text-lg font-semibold text-red-300">У вас нет доступа к этому чату</p>
            <p className="text-sm text-red-200">
              Чтобы просматривать сообщения, нужно быть участником беседы.
            </p>
            <BackToHomeLink className="mx-auto" />
          </section>
        ) : null}
        {authLoading || loadingConversation ? (
          <section className="glass px-8 py-10 text-sm text-fg/70">Загружаем чат…</section>
        ) : null}
        {!authLoading && !loadingConversation && !accessDenied && conversation ? (
          <>
            <section className="glass flex items-center gap-4 px-8 py-8">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                {companionAvatar ? (
                  <img src={companionAvatar} alt={companionName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-fg/60">Нет фото</div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-wide text-fg/60">Чат с</p>
                <h1 className="text-xl font-semibold text-fg">{companionName}</h1>
                {companionCity ? <p className="text-sm text-fg/70">{companionCity}</p> : null}
              </div>
            </section>
            <section className="glass flex flex-col gap-4 px-8 py-8">
              <ChatMessageList
                messages={messages}
                currentUserId={user.id}
                loading={loadingMessages}
                formatTimestamp={formatTime}
              />
              <ChatInput
                value={messageText}
                onChange={(event) => {
                  if (messagesError) {
                    setMessagesError('');
                  }
                  setMessageText(event.target.value);
                }}
                onSubmit={handleSubmit}
                disabled={isSending || loadingMessages || !hasSupabaseEnv}
                isSending={isSending}
                error={messagesError}
              />
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
