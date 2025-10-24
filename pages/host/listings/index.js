import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '../../../components/AuthProvider';
import { Button } from '../../../components/ui/button';

export default function HostListingsPage() {
  const router = useRouter();
  const { supabase, hasSupabaseEnv } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!supabase || !hasSupabaseEnv) {
      setLoading(false);
      setError('Не настроено подключение к Supabase.');
      return;
    }

    let active = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;

      const currentUser = data?.user;
      if (!currentUser) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!active) return;

      if (profile?.role !== 'host') {
        router.replace('/profile');
        return;
      }

      setIsHost(true);

      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, city, guests, photos')
        .eq('host_id', currentUser.id);

      if (!active) return;

      if (listingsError) {
        setError(listingsError.message);
        setListings([]);
      } else {
        setError('');
        setListings(listingsData ?? []);
      }

      setLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, [supabase, hasSupabaseEnv, router]);

  return (
    <>
      <Head>
        <title>Мои объявления — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-4xl flex-col gap-6 px-6 pb-16">
        <section className="glass flex flex-col gap-6 px-8 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-fg">Мои объявления</h1>
            <p className="text-sm text-fg/70">Управляйте жильём, которое вы публикуете в Домике.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/host/listings/new">Новое объявление</Link>
            </Button>
            <Button variant="ghost" disabled>
              Редактировать
            </Button>
          </div>
          {loading ? <p className="text-sm text-fg/70">Загружаем объявления…</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {!loading && isHost && listings.length === 0 ? (
            <p className="text-sm text-fg/70">Вы ещё не опубликовали ни одного объявления.</p>
          ) : null}
          <div className="grid gap-4">
            {listings.map((listing) => {
              const cover = Array.isArray(listing.photos) ? listing.photos[0] : null;
              return (
                <div
                  key={listing.id}
                  className="glass flex flex-col gap-4 rounded-3xl border border-white/15 bg-white/5 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div className="h-20 w-28 overflow-hidden rounded-2xl border border-white/15 bg-white/10">
                      {cover ? (
                        <img src={cover} alt={listing.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-fg/60">Нет фото</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <h2 className="text-lg font-semibold text-fg">{listing.title}</h2>
                      <p className="text-sm text-fg/70">{listing.city}</p>
                      <p className="text-xs text-fg/60">Гостей: {listing.guests}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    <Link href={`/listings/${listing.id}`} className="text-sm text-white hover:text-white/80">
                      Открыть объявление
                    </Link>
                    <Button variant="ghost" disabled>
                      Редактировать
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
