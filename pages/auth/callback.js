import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { hasSupabaseEnv, supabase } from '../../lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Обрабатываем вход...');

  useEffect(() => {
    let isActive = true;

    if (!supabase) {
      if (isActive) {
        setMessage('Supabase env не настроены (URL/KEY).');
      }
      return;
    }

    const handleSessionExchange = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        if (isActive) {
          setMessage('Не удалось завершить вход. Попробуйте ещё раз.');
        }
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      const role = user?.user_metadata?.role;

      router.replace(role ? '/app' : '/onboarding/choose-role');
    };

    handleSessionExchange();

    return () => {
      isActive = false;
    };
  }, [router]);

  return (
    <>
      <Head>
        <title>Возвращаемся в Домик…</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-sm px-6 py-8 text-center text-sm text-fg/80">
          {!hasSupabaseEnv ? 'Supabase env не настроены (URL/KEY).' : message}
        </div>
      </main>
    </>
  );
}
