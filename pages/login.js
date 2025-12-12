import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '../components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/profile');
    }
  }, [user, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.replace('/profile');
    } catch (err) {
      let code = null;
      if (err && typeof err === 'object') {
        const body = err.body ?? err.response?.data ?? null;
        if (body) {
          if (typeof body === 'string') {
            try {
              const parsed = JSON.parse(body);
              code = parsed?.message?.code ?? parsed?.code ?? null;
            } catch (_) {
              code = null;
            }
          } else if (typeof body === 'object') {
            code = body?.message?.code ?? body?.code ?? null;
          }
        }
      }

      if (code === 'USER_NOT_FOUND') {
        setError('Пользователь ещё не зарегистрирован');
      } else if (code === 'INVALID_PASSWORD') {
        setError('Неверный пароль');
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
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
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
