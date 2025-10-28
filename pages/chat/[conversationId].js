import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

import BackToHomeLink from '../../components/BackToHomeLink';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../components/AuthProvider';

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
  const [companion, setCompanion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState('');
  const [messagesError, setMessagesError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!conversationId || authLoading) {
      return;
    }

    if (!hasSupabaseEnv || !supabase) {
      setError('');
      setLoadingConversation(false);
      setLoadingMessages(false);
      return;
    }

    if (!user?.id) {
      return;
    }

    let isMounted = true;
    setLoadingConversation(true);
    setAccessDenied(false);
    setError('');

    const loadConversation = async () => {
      const { data, error: conversationError } = await supabase
        .from('conversations')
        .select('id, host_id, traveler_id, listing_id, created_at')
        .eq('id', conversationId)
        .maybeSingle();

      if (!isMounted) return;

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
      isMounted = false;
    };
  }, [conversationId, supabase, user, authLoading, hasSupabaseEnv]);

  useEffect(() => {
    if (!conversation || !supabase || !user?.id) {
      return;
    }

    const companionId = conversation.host_id === user.id ? conversation.traveler_id : conversation.host_id;

    if (!companionId) {
      setCompanion(null);
      return;
    }

    let isMounted = true;

    const loadCompanion = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, city, avatar_url')
        .eq('id', companionId)
        .maybeSingle();

      if (!isMounted) return;

      setCompanion(data ?? null);
    };

    loadCompanion();

    return () => {
      isMounted = false;
    };
  }, [conversation, supabase, user]);

  useEffect(() => {
    if (!conversation?.id || !supabase || !user?.id) {
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);
    setMessagesError('');
    setMessages([]);

    const loadMessages = async () => {
      const { data, error: messagesLoadError } = await supabase
        .from('messages')
        .select('id, sender_id, text, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (!isMounted) return;

      if (messagesLoadError) {
        setMessagesError(messagesLoadError.message);
        setMessages([]);
      } else {
        setMessages(data ?? []);
      }

      setLoadingMessages(false);
    };

    loadMessages();

    const channel = supabase
      .channel(`messages-conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const newMessage = payload.new;
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
      isMounted = false;
      channel?.unsubscribe();
    };
  }, [conversation, supabase, user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const companionName = useMemo(() => combineName(companion), [companion]);
  const companionCity = companion?.city ?? '';
  const companionAvatar = companion?.avatar_url ?? '';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!messageText.trim() || !conversation?.id || !supabase || !user?.id) {
      return;
    }

    setIsSending(true);
    const text = messageText.trim();

    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      text
    });

    if (insertError) {
      setMessagesError(insertError.message);
    } else {
      setMessagesError('');
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
          <section className="glass px-8 py-10 text-sm text-fg/70">Подключение к Supabase недоступно.</section>
        ) : null}
        {error ? (
          <section className="glass px-8 py-10 text-sm text-red-400">{error}</section>
        ) : null}
        {accessDenied ? (
          <section className="glass flex flex-col gap-4 px-8 py-10 text-center text-sm text-fg/80">
            <p className="text-base font-semibold text-fg">Нет доступа</p>
            <p>У вас нет прав для просмотра этого чата.</p>
            <Link href="/" className="text-sm font-medium text-emerald-300 transition hover:text-emerald-200">
              ← На главную
            </Link>
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
                <h1 className="text-xl font-semibold text-fg">{companionName}</h1>
                {companionCity ? <p className="text-sm text-fg/70">{companionCity}</p> : null}
              </div>
            </section>
            <section className="glass flex flex-col gap-4 px-8 py-8">
              <div className="flex min-h-[300px] flex-col gap-4 overflow-y-auto pr-2">
                {loadingMessages ? (
                  <p className="text-sm text-fg/70">Загружаем сообщения…</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-fg/70">Сообщений пока нет. Напишите первым!</p>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender_id === user.id;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm ${
                            isOwn
                              ? 'bg-emerald-600 text-white'
                              : 'border border-white/20 bg-white/10 text-fg'
                          }`}
                        >
                          <p className="whitespace-pre-line break-words text-sm leading-relaxed">{message.text}</p>
                          <span className={`mt-2 block text-right text-xs ${isOwn ? 'text-white/70' : 'text-fg/50'}`}>
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-4">
                <textarea
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  rows={3}
                  placeholder="Напишите сообщение"
                  className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-3 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                />
                <Button type="submit" disabled={isSending || !messageText.trim()} className="self-end">
                  {isSending ? 'Отправляем…' : 'Отправить'}
                </Button>
              </form>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
