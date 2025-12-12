import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function LegacyRolePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding');
  }, [router]);

  return null;
}
