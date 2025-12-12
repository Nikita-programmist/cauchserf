import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '../../components/AuthProvider';
import { apiClient } from '../../lib/apiClient';

const roleLabels = {
  TRAVELER: 'Я путешественник',
  HOST: 'Я хост'
};

export default function RoleOnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser, token } = useAuth();
  const [error, setError] = useState('');
  const [submittingRole, setSubmittingRole] = useState('');

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

  const handleSelectRole = async (role) => {
    setError('');
    setSubmittingRole(role);
    try {
      await apiClient.post('/users/me/role', { role });
      const profile = await refreshUser();
      if (profile?.role === 'HOST') {
        router.replace('/host/setup');
      } else if (profile?.role === 'TRAVELER') {
        router.replace('/feed');
      } else {
        router.replace('/profile');
      }
    } catch (err) {
      const message = err?.message || 'Не удалось сохранить роль. Попробуйте ещё раз.';
      setError(message);
    } finally {
      setSubmittingRole('');
    }
  };

  const isLoading = authLoading || (!user && !error && !token);

  return (
    <>
      <Head>
        <title>Кто вы в Домике — Домик</title>
      </Head>
      <main className="mx-auto mt-20 flex w-full max-w-lg flex-col gap-6 px-6">
        <div className="glass flex flex-col gap-6 px-6 py-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Онбординг</p>
            <h1 className="mt-2 text-2xl font-semibold text-fg">Выберите свою роль</h1>
            <p className="text-sm text-fg/70">Это поможет нам настроить сервис под ваши задачи.</p>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-fg/70">
              Загружаем профиль…
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(roleLabels).map(([role, label]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  disabled={!!submittingRole}
                  className="w-full rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-left text-base font-semibold text-fg transition hover:border-white/60 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submittingRole === role ? 'Сохраняем…' : label}
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
