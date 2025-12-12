import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function LegacyHostPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding');
  }, [router]);

  return null;
}
