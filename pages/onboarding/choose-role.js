import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabaseClient';

export default function ChooseRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');

  useEffect(() => {
    let isMounted = true;

    const ensureAuthenticated = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (profile?.role) {
        router.replace('/profile');
        return;
      }

      setLoading(false);
    };

    ensureAuthenticated();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleChooseRole = async (role) => {
    setAction(role);
    router.push(role === 'traveler' ? '/onboarding/traveler' : '/onboarding/host');
    setAction('');
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
        <title>Выберите роль — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-6 px-6">
        <div className="glass flex flex-col gap-6 px-8 py-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Шаг 1</p>
            <h1 className="mt-2 text-2xl font-semibold text-fg">Кто вы в Домике?</h1>
            <p className="text-sm text-fg/70">Выберите роль, чтобы мы показали вам нужные вопросы.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleChooseRole('traveler')}
              disabled={!!action}
              className="rounded-2xl border border-white/20 bg-white/5 px-6 py-6 text-left transition hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <h2 className="text-lg font-semibold text-fg">Я путешественник</h2>
              <p className="mt-2 text-sm text-fg/70">Ищу уютные дома и людей, с которыми можно поделиться историями.</p>
              <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-fg/70">
                {action === 'traveler' ? 'Сохраняем…' : 'traveler'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleChooseRole('host')}
              disabled={!!action}
              className="rounded-2xl border border-white/20 bg-white/5 px-6 py-6 text-left transition hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <h2 className="text-lg font-semibold text-fg">Я хозяин</h2>
              <p className="mt-2 text-sm text-fg/70">Готов принимать гостей и показывать город своими глазами.</p>
              <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-fg/70">
                {action === 'host' ? 'Сохраняем…' : 'host'}
              </span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
