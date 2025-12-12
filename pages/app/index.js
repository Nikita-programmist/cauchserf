import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';

import { useAuth } from '../../components/AuthProvider';

const roleLabels = {
  HOST: 'Хозяин',
  GUEST: 'Путешественник'
};

export default function AppHomePage() {
  const router = useRouter();
  const { logout, refreshUser, loading: authLoading, token } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUser = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const profile = await refreshUser();
      if (!profile) {
        router.replace('/login');
        return;
      }
      if (!profile.role) {
        router.replace('/onboarding');
        return;
      }
      setUser(profile);
    } catch (err) {
      if (err?.status === 404 && err?.body?.code === 'PROFILE_NOT_CREATED') {
        router.replace('/onboarding');
        return;
      }
      if (err?.status === 401) {
        router.replace('/login');
        return;
      }
      setError(err?.message || 'Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, [refreshUser, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    loadUser();
  }, [authLoading, token, loadUser, router]);

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-sm px-6 py-8 text-center text-sm text-fg/70">
          {error ? (
            <div className="flex flex-col gap-3">
              <p>{error}</p>
              <button
                type="button"
                onClick={loadUser}
                className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-fg hover:border-white/60 hover:bg-white/10"
              >
                Повторить попытку
              </button>
            </div>
          ) : (
            'Загружаем профиль…'
          )}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-sm px-6 py-8 text-center text-sm text-red-400">
          <div className="flex flex-col gap-3">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadUser}
              className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-fg hover:border-white/60 hover:bg-white/10"
            >
              Повторить попытку
            </button>
          </div>
        </div>
      </main>
    );
  }

  const roleLabel = user?.role ? roleLabels[user.role] ?? user.role : '—';

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
            <div className="rounded-2xl border border-white/20 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-fg/60">Имя</p>
              <p className="mt-2 text-lg font-semibold text-fg">{user?.name || 'Без имени'}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/5 px-5 py-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-fg/60">Email</p>
              <p className="mt-2 text-sm text-fg/80">{user?.email}</p>
            </div>
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
