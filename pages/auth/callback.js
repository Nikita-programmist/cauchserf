import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Загружаем...');

  useEffect(() => {
    let isActive = true;

    const handleSessionExchange = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        if (isActive) {
          setMessage('Не удалось завершить вход. Попробуйте ещё раз.');
        }
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      router.replace(profile?.role ? '/profile' : '/onboarding/choose-role');
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
          {message}
        </div>
      </main>
    </>
  );
}
