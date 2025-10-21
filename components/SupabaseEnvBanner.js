import { hasSupabaseEnv } from '../lib/supabaseClient';

export function SupabaseEnvBanner() {
  if (hasSupabaseEnv) {
    return null;
  }

  return (
    <div
      className="mx-auto mb-4 mt-4 w-full max-w-3xl rounded-xl border border-yellow-300/40 bg-yellow-200/20 px-4 py-3 text-sm text-yellow-900 shadow-lg"
    >
      Supabase env не настроены (URL/KEY).
    </div>
  );
}
