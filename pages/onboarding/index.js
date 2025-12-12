import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '../../components/AuthProvider';
import { completeOnboarding } from '../../lib/authClient';

const roles = [
  {
    key: 'GUEST',
    title: 'Путешественник',
    description: 'Ищите уютные места для проживания и бронируйте безопасно.'
  },
  {
    key: 'HOST',
    title: 'Хост',
    description: 'Размещайте свои объекты и принимайте гостей из сообщества.'
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { token, user, refreshUser, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    if (user?.role) {
      router.replace('/profile');
    }
  }, [authLoading, token, user, router]);

  const handleSelect = async (role) => {
    setError('');
    setSubmitting(role);
    try {
      await completeOnboarding(role);
      await refreshUser();
      router.replace('/profile/edit');
    } catch (err) {
      const body = err?.body ?? {};
      const message = body?.message || err?.message || 'Не удалось сохранить выбор. Попробуйте ещё раз.';
      setError(message);
    } finally {
      setSubmitting('');
    }
  };

  const isLoading = authLoading || (!user && !error && !token);

  return (
    <>
      <Head>
        <title>Онбординг — Домик</title>
      </Head>
      <main className="mx-auto mt-20 flex w-full max-w-4xl flex-col gap-6 px-6 pb-16">
        <div className="glass flex flex-col gap-6 px-6 py-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Онбординг</p>
            <h1 className="mt-2 text-2xl font-semibold text-fg">Кем вы будете в Домике?</h1>
            <p className="text-sm text-fg/70">Выберите роль, чтобы мы настроили сервис под ваши задачи.</p>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-fg/70">Загружаем профиль…</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {roles.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => handleSelect(role.key)}
                  disabled={!!submitting}
                  className="flex h-full flex-col items-start gap-2 rounded-2xl border border-white/25 bg-white/5 px-5 py-4 text-left transition hover:border-white/60 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-fg">{role.title}</span>
                  </div>
                  <p className="text-sm text-fg/70">{role.description}</p>
                  <span className="mt-auto rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-fg/80">
                    {submitting === role.key ? 'Сохраняем…' : 'Выбрать'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      </main>
    </>
  );
}
