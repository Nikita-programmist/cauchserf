import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <>
      <Head>
        <title>Перенаправление — Домик</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-sm px-6 py-8 text-center text-sm text-fg/80">Перенаправляем вас…</div>
      </main>
    </>
  );
}
