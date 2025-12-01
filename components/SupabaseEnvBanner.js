const hasApiBase = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);

export function SupabaseEnvBanner() {
  if (hasApiBase) {
    return null;
  }

  return (
    <div className="mx-auto mb-4 mt-4 w-full max-w-3xl rounded-xl border border-yellow-300/40 bg-yellow-200/20 px-4 py-3 text-sm text-yellow-900 shadow-lg">
      Укажите NEXT_PUBLIC_API_BASE_URL, чтобы фронтенд мог обращаться к новому NestJS API.
    </div>
  );
}
