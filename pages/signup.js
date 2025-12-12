import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '../components/AuthProvider';

export default function SignUpPage() {
  const router = useRouter();
  const { user, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      router.replace('/profile');
    }
  }, [user, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await register(email, password);
      setSuccessMessage('Регистрация прошла успешно! Перенаправляем...');
      setEmail('');
      setPassword('');
      router.replace('/profile');
    } catch (err) {
      const body = err?.body ?? err?.response?.data;
      const messageFromBody =
        (typeof body?.message === 'string' && body.message) ||
        (Array.isArray(body?.message) ? body.message.join(', ') : null);

      if (messageFromBody) {
        setError(messageFromBody);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Ошибка регистрации');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Зарегистрироваться — Домик</title>
      </Head>
      <main className="mx-auto mt-20 flex w-full max-w-md flex-col gap-6 px-6">
        <div className="glass flex flex-col gap-6 px-6 py-8">
          <div>
            <h1 className="text-2xl font-semibold text-fg">Создать аккаунт</h1>
            <p className="text-sm text-fg/70">Укажите почту и пароль, чтобы начать путешествие с Домиком.</p>
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
                placeholder="Придумайте пароль"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-400">{successMessage}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Отправляем...' : 'Зарегистрироваться'}
            </button>
          </form>
          <p className="text-sm text-fg/70">
            Уже с нами?{' '}
            <Link href="/login" className="text-fg">
              Войдите
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
}
