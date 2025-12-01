'use client';

import { ReactNode } from 'react';

import { AuthProvider } from '../components/AuthProvider';
import { SupabaseEnvBanner } from '../components/SupabaseEnvBanner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SupabaseEnvBanner />
      {children}
    </AuthProvider>
  );
}

export default Providers;
