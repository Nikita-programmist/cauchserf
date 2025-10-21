import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { hasSupabaseEnv, supabase } from '../../lib/supabaseClient';

export default function TravelerOnboardingPage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setLoading(false);
      setError('Supabase env не настроены (URL/KEY).');
      return () => {
        isMounted = false;
      };
    }

    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      const user = data?.user;

      if (!user) {
        router.replace('/login');
        return;
      }

      const role = user.user_metadata?.role;
      if (role && role !== 'traveler') {
        router.replace('/app');
        return;
      }

      setCity(user.user_metadata?.city ?? '');
      setBio(user.user_metadata?.bio ?? '');
      setLoading(false);
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setError('Supabase env не настроены (URL/KEY).');
      return;
    }
    setError('');
    setSaving(true);

    const { error: updateError } = await supabase.auth.updateUser({
      data: { city, bio }
    });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push('/app');
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-sm px-6 py-8 text-center text-sm text-fg/70">Загружаем…</div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>О вас — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6">
        <div className="glass flex flex-col gap-6 px-8 py-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Шаг 2</p>
            <h1 className="mt-2 text-2xl font-semibold text-fg">Расскажите о себе</h1>
            <p className="text-sm text-fg/70">Мы покажем вам путешествия и людей, которые подойдут именно вам.</p>
          </div>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Ваш город
              <input
                type="text"
                required
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Например, Казань"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              О себе
              <textarea
                required
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                placeholder="Чем вы увлекаетесь и что ищете в поездках?"
                className="w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-3 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            {!hasSupabaseEnv ? (
              <p className="text-sm text-red-500">Supabase env не настроены (URL/KEY).</p>
            ) : null}
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <button
              type="submit"
              disabled={saving || !supabase}
              className="self-start rounded-xl bg-white/80 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Сохраняем…' : 'Продолжить'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
