import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '../components/AuthProvider';

const truncate = (text, limit = 160) => {
  if (!text) return '';
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}…`;
};

export default function SearchPage() {
  const { supabase, hasSupabaseEnv } = useAuth();
  const [cityInput, setCityInput] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const city = cityInput.trim();
    if (!city) {
      setError('Укажите город для поиска.');
      setListings([]);
      setHasSearched(false);
      return;
    }

    if (!supabase || !hasSupabaseEnv) {
      setError('Поиск недоступен: отсутствует соединение с Supabase.');
      setListings([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    const normalized = city.toLowerCase();

    const { data, error: searchError } = await supabase
      .from('listings')
      .select('id, title, city, guests, description, photos')
      .ilike('city', `%${normalized}%`);

    if (searchError) {
      setError(searchError.message || 'Не удалось выполнить поиск.');
      setListings([]);
    } else {
      setListings(data ?? []);
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Поиск жилья — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-5xl flex-col gap-6 px-6 pb-16">
        <section className="glass flex flex-col gap-6 px-8 py-10">
          <div>
            <h1 className="text-3xl font-semibold text-fg">Найдите жильё мечты</h1>
            <p className="mt-2 text-sm text-fg/70">
              Введите город, чтобы увидеть доступные варианты размещения.
            </p>
          </div>
          <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleSubmit}>
            <label className="flex w-full flex-col gap-2 text-sm text-fg/80 md:w-2/3">
              <span>Город</span>
              <input
                type="text"
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
                placeholder="Например, Санкт-Петербург"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-white/80 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white md:self-end"
              disabled={loading}
            >
              {loading ? 'Ищем…' : 'Искать'}
            </button>
          </form>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {!loading && hasSearched && !error && listings.length === 0 ? (
            <p className="text-sm text-fg/70">По вашему запросу ничего не найдено.</p>
          ) : null}
        </section>
        {listings.length > 0 ? (
          <section className="grid gap-6 md:grid-cols-2">
            {listings.map((listing) => {
              const cover = Array.isArray(listing.photos) ? listing.photos[0] : null;
              return (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="glass group flex h-full flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/5"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-white/5">
                    {cover ? (
                      <img
                        src={cover}
                        alt={listing.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-fg/50">
                        Нет изображения
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 px-6 py-5">
                    <div>
                      <h2 className="text-lg font-semibold text-fg">{listing.title}</h2>
                      <p className="text-sm text-fg/70">{listing.city}</p>
                    </div>
                    <p className="text-sm text-fg/80">Максимум гостей: {listing.guests}</p>
                    {listing.description ? (
                      <p className="text-sm text-fg/70">{truncate(listing.description)}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </section>
        ) : null}
      </main>
    </>
  );
}
