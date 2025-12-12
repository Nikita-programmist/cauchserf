import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ChooseRolePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding/role');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-sm px-6 py-8 text-center text-sm text-fg/70">Перенаправляем на выбор роли…</div>
    </main>
  );
}
