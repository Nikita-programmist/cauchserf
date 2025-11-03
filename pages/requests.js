import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import BackToHomeLink from '../components/BackToHomeLink';
import ChatWindow from '../components/chat/ChatWindow';
import { supabase } from '../lib/supabaseClient';

const genderLabels = {
  male: 'Мужской',
  female: 'Женский',
  other: 'Другое'
};

const roleLabels = {
  host: 'Хозяин',
  traveler: 'Путешественник'
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('ru-RU');
};

export default function RequestsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeParticipant, setActiveParticipant] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (!profileData) {
        router.replace('/onboarding/choose-role');
        return;
      }

      setProfile(profileData);

      if (profileData.role !== 'host') {
        setLoading(false);
        return;
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from('stay_requests')
        .select(
          `
            id,
            listing_id,
            traveler_id,
            start_date,
            end_date,
            message,
            status,
            created_at,
            conversation_id,
            traveler:traveler_id (
              id,
              first_name,
              last_name,
              city,
              age,
              gender,
              bio,
              avatar_url,
              role
            )
          `
        )
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (requestsError) {
        setError(requestsError.message);
        setLoading(false);
        return;
      }

      setRequests(requestsData ?? []);
      setLoading(false);
    };

    loadRequests();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const isHost = profile?.role === 'host';
  const user = profile;

  const handleOpenChat = useCallback(
    async (request) => {
      if (!request) return;
      setChatError('');
      setChatLoading(true);
      setActiveParticipant(null);

      try {
        const response = await fetch(`/api/stay-requests/${request.id}/ensure-conversation`, {
          method: 'POST',
          credentials: 'include'
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.conversationId) {
          throw new Error(data?.error ?? 'failed');
        }
        setActiveConversationId(data.conversationId);
        setRequests((prev) =>
          prev.map((item) =>
            item.id === request.id
              ? { ...item, conversation_id: data.conversationId }
              : item
          )
        );
      } catch (err) {
        setChatError('Не удалось открыть чат. Попробуйте позже.');
        setActiveParticipant(null);
      } finally {
        setChatLoading(false);
      }
    },
    []
  );

  const content = useMemo(() => {
    if (loading) {
      return <div className="glass px-8 py-10 text-center text-sm text-fg/70">Загружаем заявки…</div>;
    }

    if (error) {
      return <div className="glass px-8 py-10 text-center text-sm text-red-400">{error}</div>;
    }

    if (!profile) {
      return null;
    }

    if (!isHost) {
      return (
        <div className="glass flex flex-col gap-4 px-8 py-10 text-sm text-fg/80">
          <h1 className="text-2xl font-semibold text-fg">Заявки гостей</h1>
          <p>Заявки доступны только хозяевам.</p>
          <Link href="/" className="text-sm font-medium text-fg hover:underline">
            Вернуться на главную
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="glass flex flex-1 flex-col gap-6 px-8 py-10">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Входящие</p>
            <h1 className="text-2xl font-semibold text-fg">Заявки гостей</h1>
            <p className="text-sm text-fg/70">Здесь появляются запросы путешественников на проживание.</p>
          </div>
          {requests.length === 0 ? (
            <div className="rounded-3xl border border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-fg/70">
              <p className="text-base font-medium text-fg">Пока нет заявок</p>
              <p className="mt-2 text-sm text-fg/60">
                Когда путешественники попросятся в гости, вы увидите их тут.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {requests.map((request) => {
                const traveler = request.traveler;
                const fullName = `${traveler?.first_name ?? ''} ${traveler?.last_name ?? ''}`.trim() || 'Без имени';
                const city = traveler?.city ?? '';
                const age = traveler?.age != null ? String(traveler.age) : '';
                const gender = traveler?.gender ? genderLabels[traveler.gender] ?? traveler.gender : '';
                const details = [city, age, gender].filter(Boolean).join(' • ');
                const bio = traveler?.bio?.trim() || 'Гость пока не рассказал о себе.';
                const travelerRoleLabel = traveler?.role ? roleLabels[traveler.role] ?? traveler.role : null;
                const datesText = `${formatDate(request.start_date)} → ${formatDate(request.end_date)}`;
                const messageText = request.message?.trim() || 'Гость не оставил сообщение.';

                return (
                  <article
                    key={request.id}
                    className="rounded-3xl border border-white/15 bg-white/5 px-6 py-6 shadow-lg shadow-slate-900/5"
                  >
                  <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <div className="flex-shrink-0">
                      <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/20 bg-white/5">
                        {traveler?.avatar_url ? (
                          <img
                            src={traveler.avatar_url}
                            alt={fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-fg/60">Нет фото</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 text-sm text-fg/80">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-fg">{fullName}</h2>
                          {travelerRoleLabel ? (
                            <span className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-fg/70">
                              {travelerRoleLabel}
                            </span>
                          ) : null}
                        </div>
                        {details ? <p className="text-sm text-fg/70">{details}</p> : null}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-fg/60">О себе</p>
                        <p className="mt-2 text-sm text-fg/80">{bio}</p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-fg/60">Даты поездки</p>
                          <p className="mt-1 text-sm text-fg">{datesText}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-fg/60">Сообщение</p>
                          <p className="mt-1 whitespace-pre-line text-sm text-fg/80">{messageText}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                          href={`/profile/${request.traveler_id}`}
                          className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-fg/80 transition hover:border-white/60 hover:bg-white/10"
                        >
                          Профиль гостя
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenChat(request)}
                          className="inline-flex items-center justify-center rounded-full border border-[#003B32]/40 px-4 py-2 text-sm font-medium text-[#003B32] transition hover:border-[#003B32]/60 hover:bg-[#003B32]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005C4B]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                        >
                          {request.conversation_id ? 'Открыть чат' : 'Создать чат'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </div>
        <aside className="glass flex w-full max-w-full flex-col gap-3 rounded-3xl border border-white/15 bg-white/5 px-6 py-6 text-sm text-fg/80 lg:w-[360px]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-fg">Чат по заявке</h2>
            {chatLoading ? (
              <span className="text-xs text-fg/60">создаём…</span>
            ) : null}
          </div>
          {chatError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {chatError}
            </div>
          ) : null}
          {activeConversationId ? (
            <div className="h-[420px]">
                <ChatWindow
                  conversationId={activeConversationId}
                  currentUserId={user?.id}
                />
            </div>
          ) : (
            <p className="text-xs text-fg/70">
              Выберите заявку, чтобы открыть переписку с путешественником.
            </p>
          )}
        </aside>
      </div>
    );
  }, [
    activeConversationId,
    activeParticipant,
    chatError,
    chatLoading,
    error,
    handleOpenChat,
    isHost,
    loading,
    profile,
    requests
  ]);

  return (
    <>
      <Head>
        <title>Заявки гостей — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-4xl flex-col gap-6 px-6 pb-16">
        <nav className="self-start">
          <BackToHomeLink />
        </nav>
        {content}
      </main>
    </>
  );
}
