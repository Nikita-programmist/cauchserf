import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import BackToHomeLink from '../../../components/BackToHomeLink';
import { useAuth } from '../../../components/AuthProvider';
import { apiClient } from '../../../lib/apiClient';

export default function HostListingsPage() {
  const router = useRouter();
  const { token, loading: authLoading, refreshUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const profile = await refreshUser();
        if (!profile) {
          router.replace('/login');
          return;
        }
        if (profile.role !== 'HOST') {
          setError('Создавать и просматривать объявления могут только хосты.');
          setLoading(false);
          return;
        }
        const data = await apiClient.get('/places/mine');
        setListings(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || 'Не удалось загрузить объявления');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, token, refreshUser, router]);

  if (loading) {
    return (
      <main className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-6 px-6">
        <BackToHomeLink className="self-start" />
        <div className="glass px-8 py-10 text-center text-sm text-fg/70">Загружаем ваши объявления…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-6 px-6">
        <BackToHomeLink className="self-start" />
        <div className="glass px-8 py-10 text-center text-sm text-red-400">{error}</div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Мои объявления — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-4xl flex-col gap-6 px-6 pb-16">
        <BackToHomeLink className="self-start" />
        <section className="glass flex flex-col gap-4 px-8 py-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Хозяин</p>
              <h1 className="text-2xl font-semibold text-fg">Ваши объявления</h1>
            </div>
            <Link
              href="/host/listings/new"
              className="rounded-xl bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
            >
              Создать объявление
            </Link>
          </div>
          {listings.length === 0 ? (
            <p className="text-sm text-fg/70">У вас пока нет объявлений.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {listings.map((place) => (
                <Link
                  key={place.id}
                  href={`/listings/${place.id}`}
                  className="rounded-2xl border border-white/20 bg-white/5 px-5 py-4 transition hover:border-white/60 hover:bg-white/10"
                >
                  <p className="text-sm font-semibold text-fg">{place.title}</p>
                  <p className="text-xs text-fg/60">{place.city}{place.country ? `, ${place.country}` : ''}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
