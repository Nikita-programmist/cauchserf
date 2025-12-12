import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SigninLegacyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}
