import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const AuthCallbackPage = () => {
  const router = useRouter();
  const supabase = useSupabaseClient();

  useEffect(() => {
    let isMounted = true;
    const navigateToOnboarding = () => {
      if (isMounted) {
        router.replace('/onboarding/role');
      }
    };

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigateToOnboarding();
      }
    };

    void checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigateToOnboarding();
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <p className="text-base text-gray-600">Заходим…</p>
    </main>
  );
};

export default AuthCallbackPage;
