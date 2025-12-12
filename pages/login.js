import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '../components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, refreshUser, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showOnboardingCta, setShowOnboardingCta] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRedirect = (profile) => {
    if (!profile) return;
    if (!profile.role) {
      router.replace('/onboarding');
      return;
    }
    router.replace('/profile');
  };

  useEffect(() => {
    if (!authLoading && user) {
      handleRedirect(user);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setShowOnboardingCta(false);
    setLoading(true);

    try {
      const result = await login(email, password);
      const profile = result?.user ?? (await refreshUser());
      handleRedirect(profile);
    } catch (err) {
      const body = err?.body ?? err?.response?.data;
      const status = err?.status ?? err?.response?.status;
      const code = body?.code;
      const messageFromBody =
        (typeof body?.message === 'string' && body.message) ||
        (Array.isArray(body?.message) ? body.message.join(', ') : null);

      if (status === 401) {
        setError('Неверный email/пароль');
      } else if (status === 404 && code === 'USER_NOT_FOUND') {
        setError('Пользователь не зарегистрирован');
      } else if (status === 404 && code === 'PROFILE_NOT_FOUND') {
        setError('Заполните анкету');
        setShowOnboardingCta(true);
      } else if (messageFromBody) {
        setError(messageFromBody);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Ошибка входа');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Войти — Домик</title>
      </Head>
      <main className="mx-auto mt-20 flex w-full max-w-md flex-col gap-6 px-6">
        <div className="glass flex flex-col gap-6 px-6 py-8">
          <div>
            <h1 className="text-2xl font-semibold text-fg">Войти</h1>
            <p className="text-sm text-fg/70">Используйте свою почту и пароль, чтобы продолжить.</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Пароль
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Введите пароль"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            {error ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-red-500">{error}</p>
                {showOnboardingCta ? (
                  <button
                    type="button"
                    onClick={() => router.push('/onboarding')}
                    className="inline-flex w-max items-center justify-center rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-fg hover:border-white/60 hover:bg-white/10"
                  >
                    Заполнить
                  </button>
                ) : null}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>
          <p className="text-sm text-fg/70">
            Нет аккаунта?{' '}
            <Link href="/signup" className="text-fg">
              Зарегистрируйтесь
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
}
