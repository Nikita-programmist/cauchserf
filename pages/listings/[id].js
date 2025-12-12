import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import BackToHomeLink from '../../components/BackToHomeLink';
import { apiClient } from '../../lib/apiClient';

export default function ListingDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [place, setPlace] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiClient.get(`/places/${id}`);
        setPlace(data);
      } catch (err) {
        setError(err?.message || 'Не удалось загрузить объявление');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  return (
    <>
      <Head>
        <title>{place?.title ? `${place.title} — Домик` : 'Объявление — Домик'}</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-4xl flex-col gap-6 px-6 pb-16">
        <BackToHomeLink className="self-start" />
        {loading ? (
          <div className="glass px-8 py-10 text-center text-sm text-fg/70">Загружаем объявление…</div>
        ) : null}
        {error ? <div className="glass px-8 py-10 text-center text-sm text-red-400">{error}</div> : null}
        {!loading && !error && place ? (
          <section className="glass flex flex-col gap-6 px-8 py-10">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Объявление</p>
              <h1 className="text-3xl font-semibold text-fg">{place.title}</h1>
              <p className="text-sm text-fg/70">{place.city}{place.country ? `, ${place.country}` : ''}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-fg/80">
                <p className="text-xs uppercase tracking-wide text-fg/60">Описание</p>
                <p className="mt-2">{place.description || 'Описание не указано.'}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-fg/80">
                <p className="text-xs uppercase tracking-wide text-fg/60">Вместимость</p>
                <p className="mt-2">{place.capacity ? `${place.capacity} гостей` : 'Не указано'}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-fg/80">
                <p className="text-xs uppercase tracking-wide text-fg/60">Адрес</p>
                <p className="mt-2">{place.address || 'Не указан'}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-fg/80">
                <p className="text-xs uppercase tracking-wide text-fg/60">Стоимость</p>
                <p className="mt-2">{place.pricePerNight ? `${place.pricePerNight} ₽ за ночь` : 'По запросу'}</p>
              </div>
            </div>
            {place.hostProfile ? (
              <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-fg/80">
                <p className="text-xs uppercase tracking-wide text-fg/60">Хозяин</p>
                <p className="mt-2 text-base text-fg">{place.hostProfile.user?.name || 'Хозяин Домика'}</p>
                <p className="text-sm text-fg/70">{place.hostProfile.user?.email || '—'}</p>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </>
  );
}
