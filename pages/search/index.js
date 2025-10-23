import Head from 'next/head';
import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabaseClient';

export default function SearchPage() {
  const [cityInput, setCityInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!searchTerm) {
      setResults([]);
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, city, bio, avatar_url, beds')
        .eq('role', 'host')
        .ilike('city', `%${searchTerm}%`)
        .limit(50);

      if (!isActive) {
        return;
      }

      if (searchError) {
        setError(searchError.message);
        setResults([]);
      } else {
        setError('');
        setResults(data ?? []);
      }

      setLoading(false);
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = cityInput.trim();

    if (trimmed.length < 2) {
      setError('Введите минимум 2 символа для поиска.');
      setResults([]);
      setHasSearched(false);
      setSearchTerm('');
      return;
    }

    setError('');
    setHasSearched(true);
    setSearchTerm(trimmed);
  };

  return (
    <>
      <Head>
        <title>Поиск хостов — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-6 px-6">
        <div className="glass flex flex-col gap-6 px-8 py-10">
          <div>
            <h1 className="text-2xl font-semibold text-fg">Найдите хоста в своём городе</h1>
            <p className="text-sm text-fg/70">Введите город, чтобы увидеть доступных хозяев Домика.</p>
          </div>
          <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleSubmit}>
            <input
              type="text"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              placeholder="Например, Санкт-Петербург"
              className="flex-1 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-white/80 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
            >
              Искать
            </button>
          </form>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {loading ? <p className="text-sm text-fg/70">Ищем подходящих хостов…</p> : null}
          {!loading && hasSearched && !error && results.length === 0 ? (
            <p className="text-sm text-fg/70">По вашему запросу ничего не найдено.</p>
          ) : null}
          <div className="grid gap-4">
            {results.map((profile) => {
              const fullName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
              return (
                <div key={profile.id} className="rounded-2xl border border-white/20 bg-white/5 px-6 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={fullName || 'Хост'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-fg/60">Нет фото</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-fg">{fullName || 'Без имени'}</h2>
                      <p className="text-sm text-fg/70">{profile.city || 'Город не указан'}</p>
                      {profile.bio ? <p className="mt-2 text-sm text-fg/80">{profile.bio}</p> : null}
                      {profile.beds ? (
                        <p className="mt-2 text-sm text-fg/70">Спальных мест: {profile.beds}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
