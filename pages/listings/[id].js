import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '../../components/AuthProvider';
import BackToHomeLink from '../../components/BackToHomeLink';
import { Button } from '../../components/ui/button';
import { useSendRequest } from '../../hooks/useSendRequest';

const combineName = (profile) => {
  if (!profile) return 'Хозяин';
  const { first_name: firstName, last_name: lastName } = profile;
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return fullName || 'Хозяин';
};

export default function ListingDetailsPage() {
  const router = useRouter();
  const { supabase, hasSupabaseEnv, user } = useAuth();
  const { sendRequest, isLoading: isSendingRequest, resetStatus } = useSendRequest();
  const { id } = router.query;

  const [listing, setListing] = useState(null);
  const [hostProfile, setHostProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: 'idle', text: '', conversationId: null });

  const clearStatusMessage = () => {
    setStatusMessage((current) =>
      current.type === 'idle'
        ? current
        : {
            type: 'idle',
            text: '',
            conversationId: null
          }
    );
    resetStatus();
  };

  const handleStartDateChange = (event) => {
    clearStatusMessage();
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    clearStatusMessage();
    setEndDate(event.target.value);
  };

  const handleMessageChange = (event) => {
    clearStatusMessage();
    setGuestMessage(event.target.value);
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    clearStatusMessage();

    if (!startDate || !endDate) {
      setStatusMessage({ type: 'error', text: 'Пожалуйста, укажите даты заезда и выезда.', conversationId: null });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setStatusMessage({ type: 'error', text: 'Дата выезда должна быть позже даты заезда.', conversationId: null });
      return;
    }

    if (!guestMessage.trim()) {
      setStatusMessage({ type: 'error', text: 'Пожалуйста, напишите сообщение хозяину.', conversationId: null });
      return;
    }

    const { error: requestError, conversationId } = await sendRequest({
      listingId: listing?.id,
      hostId: listing?.host_id,
      startDate,
      endDate,
      message: guestMessage.trim()
    });

    if (requestError) {
      setStatusMessage({ type: 'error', text: 'Не получилось отправить заявку. Попробуйте позже.', conversationId: null });
      return;
    }

    if (!conversationId) {
      setStatusMessage({ type: 'error', text: 'Не получилось открыть чат. Попробуйте позже.', conversationId: null });
      return;
    }

    setStartDate('');
    setEndDate('');
    setGuestMessage('');
    router.push(`/chat/${conversationId}`);
  };

  useEffect(() => {
    if (!hasSupabaseEnv || !supabase) {
      setError('Подключение к Supabase недоступно.');
      setLoading(false);
      return;
    }

    if (!id) {
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    const fetchListing = async () => {
      const { data, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!active) return;

      if (listingError || !data) {
        setError(listingError?.message || 'Объявление не найдено.');
        setListing(null);
        setHostProfile(null);
        setLoading(false);
        return;
      }

      setListing(data);

      if (data.host_id) {
        const { data: hostData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', data.host_id)
          .maybeSingle();

        if (!active) return;

        setHostProfile(hostData ?? null);
      } else {
        setHostProfile(null);
      }

      setLoading(false);
    };

    fetchListing();

    return () => {
      active = false;
    };
  }, [id, supabase, hasSupabaseEnv]);

  const photos = Array.isArray(listing?.photos) ? listing.photos.slice(0, 4) : [];
  const isHostViewing = Boolean(user?.id && listing?.host_id && listing.host_id === user.id);

  return (
    <>
      <Head>
        <title>{listing?.title ? `${listing.title} — Домик` : 'Объявление — Домик'}</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-5xl flex-col gap-8 px-6 pb-16">
        <BackToHomeLink className="self-start" />
        {loading ? (
          <section className="glass px-8 py-10 text-sm text-fg/70">Загружаем объявление…</section>
        ) : null}
        {error ? (
          <section className="glass px-8 py-10 text-sm text-red-400">{error}</section>
        ) : null}
        {!loading && !error && listing ? (
          <>
            <article className="glass flex flex-col gap-8 px-8 py-10">
              {photos.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {photos.map((photo, index) => (
                    <div key={photo} className="overflow-hidden rounded-3xl border border-white/15 bg-white/10">
                      <img src={photo} alt={`${listing.title} фото ${index + 1}`} className="h-56 w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-fg/60">
                  Фото пока нет
                </div>
              )}
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-semibold text-fg">{listing.title}</h1>
                  <p className="text-sm text-fg/70">{listing.city}</p>
                </div>
                <p className="text-sm text-fg/80">Гостей: {listing.guests}</p>
                {listing.description ? (
                  <p className="text-base leading-relaxed text-fg/80">{listing.description}</p>
                ) : null}
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/5 px-6 py-5">
                <h2 className="text-lg font-semibold text-fg">Хозяин</h2>
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-white/10">
                    {hostProfile?.avatar_url ? (
                      <img src={hostProfile.avatar_url} alt={combineName(hostProfile)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-fg/60">Нет фото</div>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-medium text-fg">{combineName(hostProfile)}</p>
                    <p className="text-sm text-fg/70">Опытный хозяин Домика</p>
                  </div>
                </div>
              </div>
            </article>
            {isHostViewing ? (
              <section className="glass px-8 py-8 text-sm text-fg/70">
                Это ваше объявление. Путешественники смогут попроситься в гости и вы увидите их заявки во вкладке «Заявки».
              </section>
            ) : (
              <section className="glass flex flex-col gap-6 px-8 py-10">
                <div>
                  <h2 className="text-lg font-semibold text-fg">План поездки</h2>
                  <p className="mt-1 text-sm text-fg/70">Расскажите, когда хотите приехать и пару слов о поездке.</p>
                </div>
                <form className="flex flex-col gap-5" onSubmit={handleRequestSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-fg/80">
                      Дата заезда
                      <input
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        required
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg focus:border-white/60 focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-fg/80">
                      Дата выезда
                      <input
                        type="date"
                        value={endDate}
                        onChange={handleEndDateChange}
                        required
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg focus:border-white/60 focus:outline-none"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-2 text-sm text-fg/80">
                    Сообщение хозяину
                    <textarea
                      value={guestMessage}
                      onChange={handleMessageChange}
                      rows={4}
                      placeholder="Расскажите немного о себе и цели поездки"
                      className="w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-3 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                      required
                    />
                  </label>
                  <Button type="submit" disabled={isSendingRequest} className="self-start">
                    {isSendingRequest ? 'Отправляем…' : 'Попроситься в гости'}
                  </Button>
                </form>
                {statusMessage.type === 'error' ? (
                  <p className="text-sm text-red-400">{statusMessage.text}</p>
                ) : null}
              </section>
            )}
          </>
        ) : null}
      </main>
    </>
  );
}
