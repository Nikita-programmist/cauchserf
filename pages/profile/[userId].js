import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';

import BackToHomeLink from '../../components/BackToHomeLink';
import { apiClient } from '../../lib/apiClient';

const roleLabels = {
  HOST: 'Хозяин',
  TRAVELER: 'Путешественник'
};

export default function PublicProfilePage() {
  const router = useRouter();
  const { userId } = router.query;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setError('');
    setLoading(true);
    try {
      const data = await apiClient.get(`/users/${userId}`);
      setProfile(data ?? null);
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const fullName = profile?.name || '';
  const roleLabel = profile ? roleLabels[profile.role] ?? '—' : '—';
  const isHost = profile?.role === 'HOST';

  return (
    <>
      <Head>
        <title>
          {profile?.name ? `${fullName || 'Профиль пользователя'} — Домик` : 'Профиль пользователя — Домик'}
        </title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6 pb-16">
        <BackToHomeLink className="self-start" />
        {loading ? (
          <div className="glass px-8 py-10 text-center text-sm text-fg/70">Загружаем профиль…</div>
        ) : null}
        {error ? (
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
        ) : null}
        {!loading && !error && !profile ? (
          <div className="glass px-8 py-10 text-center text-sm text-fg/70">Профиль не найден.</div>
        ) : null}
        {!loading && !error && profile ? (
          <section className="glass flex flex-col gap-6 px-8 py-10">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Профиль пользователя</p>
              <h1 className="text-2xl font-semibold text-fg">{fullName || 'Без имени'}</h1>
              <span className="inline-flex w-max rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-fg/80">
                {roleLabel}
              </span>
              {isHost ? <p className="text-sm text-fg/70">Опытный хозяин Домика</p> : null}
            </div>
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex-shrink-0">
                <div className="h-32 w-32 overflow-hidden rounded-2xl border border-white/20 bg-white/5">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={fullName || 'Аватар'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-fg/60">Нет фото</div>
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 text-sm text-fg/80">
                <div>
                  <p className="text-xs uppercase tracking-wide text-fg/60">Email</p>
                  <p className="mt-1 text-base text-fg">{profile?.email || '—'}</p>
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
            <div>
              <p className="text-xs uppercase tracking-wide text-fg/60">О себе</p>
              <p className="mt-2 text-sm text-fg/80">{profile?.hostProfile?.bio || 'Нет описания'}</p>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
