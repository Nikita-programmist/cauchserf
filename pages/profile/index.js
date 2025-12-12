import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import BackToHomeLink from '../../components/BackToHomeLink';
import { useAuth } from '../../components/AuthProvider';

const roleLabels = {
  HOST: 'Хозяин',
  GUEST: 'Путешественник'
};

export default function ProfilePage() {
  const router = useRouter();
  const { refreshUser, loading: authLoading, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const user = await refreshUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      if (!user.role) {
        router.replace('/onboarding');
        return;
      }
      setProfile(user);
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
    loadProfile();
  }, [authLoading, token, loadProfile, router]);

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  const fullName = profile?.name || 'Без имени';
  const roleLabel = profile?.role ? roleLabels[profile.role] ?? profile.role : '—';

  if (loading) {
    return (
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6">
        <BackToHomeLink className="self-start" />
        <div className="glass px-8 py-10 text-center text-sm text-fg/70">
          {error ? (
            <div className="flex flex-col gap-3">
              <p>{error}</p>
              <button
                type="button"
                onClick={loadProfile}
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
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6">
        <BackToHomeLink className="self-start" />
        <div className="glass px-8 py-10 text-center text-sm text-red-400">
          <div className="flex flex-col gap-3">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadProfile}
              className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-fg hover:border-white/60 hover:bg-white/10"
            >
              Повторить попытку
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Профиль — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6">
        <BackToHomeLink className="self-start" />
        <div className="glass flex flex-col gap-6 px-8 py-10">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Ваш профиль</p>
            <h1 className="text-2xl font-semibold text-fg">{fullName}</h1>
            <span className="inline-flex w-max rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-fg/80">
              {roleLabel}
            </span>
          </div>
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex-shrink-0">
              <div className="h-32 w-32 overflow-hidden rounded-2xl border border-white/20 bg-white/5">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Аватар" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-fg/60">Нет фото</div>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 text-sm text-fg/80">
              <div>
                <p className="text-xs uppercase tracking-wide text-fg/60">Email</p>
                <p className="mt-1 text-base text-fg">{profile?.email}</p>
              </div>
              {profile?.hostProfile ? (
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-fg/60">Город</p>
                    <p className="mt-1 text-base text-fg">{profile.hostProfile.city || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-fg/60">Страна</p>
                    <p className="mt-1 text-base text-fg">{profile.hostProfile.country || '—'}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link
              href="/profile/edit"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-2 text-sm font-semibold text-fg transition hover:border-white/60 hover:bg-white/10"
            >
              Редактировать
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-xl bg-white/80 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
            >
              Выйти
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
