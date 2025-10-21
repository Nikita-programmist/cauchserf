import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabaseClient';

export default function AppHomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      const currentUser = data?.user;

      if (!currentUser) {
        router.replace('/login');
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!supabase) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-sm px-6 py-8 text-center text-sm text-fg/70">
          Supabase env не настроены (URL/KEY).
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-sm px-6 py-8 text-center text-sm text-fg/70">Загружаем профиль…</div>
      </main>
    );
  }

  const metadata = user?.user_metadata ?? {};
  const roleLabel = metadata.role === 'host' ? 'Хозяин' : metadata.role === 'traveler' ? 'Путешественник' : '—';

  return (
    <>
      <Head>
        <title>Домик — ваше пространство</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-6 px-6">
        <div className="glass flex flex-col gap-6 px-8 py-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Добро пожаловать</p>
            <h1 className="mt-2 text-2xl font-semibold text-fg">Снова рады видеть вас в Домике</h1>
            <p className="text-sm text-fg/70">Ниже — данные вашего профиля. Вы всегда можете обновить их позднее.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/20 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-fg/60">Роль</p>
              <p className="mt-2 text-lg font-semibold text-fg">{roleLabel}</p>
            </div>
            {metadata.city ? (
              <div className="rounded-2xl border border-white/20 bg-white/5 px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-fg/60">Город</p>
                <p className="mt-2 text-lg font-semibold text-fg">{metadata.city}</p>
              </div>
            ) : null}
            {metadata.bio ? (
              <div className="rounded-2xl border border-white/20 bg-white/5 px-5 py-4 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-fg/60">О себе</p>
                <p className="mt-2 text-sm text-fg/80">{metadata.bio}</p>
              </div>
            ) : null}
            {metadata.beds ? (
              <div className="rounded-2xl border border-white/20 bg-white/5 px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-fg/60">Спальных мест</p>
                <p className="mt-2 text-lg font-semibold text-fg">{metadata.beds}</p>
              </div>
            ) : null}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-white/40 px-5 py-2 text-sm font-semibold text-fg transition hover:border-white/60 hover:bg-white/10"
            >
              Выйти
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
