import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function SignInPage() {
  const { supabase, user, hasSupabaseEnv } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/profile');
    }
  }, [router, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) return;
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace('/profile');
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
          {!hasSupabaseEnv ? (
            <p className="text-sm text-red-500">Supabase env не настроены (URL/KEY).</p>
          ) : null}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Email
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Пароль
              <Input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Введите пароль"
              />
            </label>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" disabled={!hasSupabaseEnv || loading} className="w-full">
              {loading ? 'Входим...' : 'Войти'}
            </Button>
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
