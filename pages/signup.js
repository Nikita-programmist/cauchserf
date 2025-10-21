import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function SignUpPage() {
  const { supabase, user, hasSupabaseEnv } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/onboarding');
    }
  }, [router, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) return;
    setError('');
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    router.replace('/onboarding');
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
            <p className="text-sm text-fg/70">Добро пожаловать в Домик! Заполните форму, чтобы начать.</p>
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
                placeholder="Придумайте пароль"
              />
            </label>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" disabled={!hasSupabaseEnv || loading} className="w-full">
              {loading ? 'Создаём...' : 'Зарегистрироваться'}
            </Button>
          </form>
          <p className="text-sm text-fg/70">
            Уже есть аккаунт?{' '}
            <Link href="/signin" className="text-fg">
              Войти
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
}
