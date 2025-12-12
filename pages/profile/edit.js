import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import BackToHomeLink from '../../components/BackToHomeLink';
import { useAuth } from '../../components/AuthProvider';
import { updateProfile as updateProfileRequest } from '../../lib/authClient';

export default function EditProfilePage() {
  const router = useRouter();
  const { token, refreshUser, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
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
      const profileData = user.hostProfile || user.guestProfile || {};
      setName(user.name || '');
      setCity(profileData.city || '');
      setCountry(profileData.country || '');
      setBio(profileData.bio || '');
      setAvatarUrl(user.avatarUrl || '');
    } catch (err) {
      if (err?.status === 404 && err?.body?.code === 'PROFILE_NOT_FOUND') {
        router.replace('/onboarding');
        return;
      }
      if (err?.status === 404 && err?.body?.code === 'USER_NOT_FOUND') {
        router.replace('/login');
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateProfileRequest({ name: name.trim(), bio: bio.trim(), city: city.trim(), country: country.trim(), avatarUrl: avatarUrl.trim() || undefined });
      await refreshUser();
      router.replace('/profile');
    } catch (err) {
      setError(err?.message || 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

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
                Повторить
              </button>
            </div>
          ) : (
            'Загружаем профиль…'
          )}
        </div>
      </main>
    );
  }

  if (error && !saving) {
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
        <title>Редактировать профиль — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6">
        <BackToHomeLink className="self-start" />
        <div className="glass flex flex-col gap-6 px-8 py-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Профиль</p>
            <h1 className="mt-2 text-2xl font-semibold text-fg">Обновите информацию о себе</h1>
            <p className="text-sm text-fg/70">Расскажите немного о себе, чтобы другим было проще познакомиться с вами.</p>
          </div>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Имя
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ваше имя"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <div className="flex flex-col gap-4 md:flex-row">
              <label className="flex flex-1 flex-col gap-2 text-sm text-fg/80">
                Город
                <input
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Например, Москва"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="flex flex-1 flex-col gap-2 text-sm text-fg/80">
                Страна
                <input
                  type="text"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  placeholder="Россия"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              О себе
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Расскажите немного о себе"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                rows={4}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              URL аватара (по желанию)
              <input
                type="text"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="rounded-xl border border-white/30 px-5 py-2 text-sm font-semibold text-fg transition hover:border-white/60 hover:bg-white/10"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-white/80 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
