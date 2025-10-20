import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const parseBoolean = (value: string | undefined) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes';
};

const SignUpPage = () => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailConfirmationEnabled = useMemo(
    () => parseBoolean(process.env.NEXT_PUBLIC_SUPABASE_EMAIL_CONFIRM),
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = (formData.get('email') as string) ?? '';
    const password = (formData.get('password') as string) ?? '';

    const emailRedirectTo =
      emailConfirmationEnabled && typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: emailConfirmationEnabled && emailRedirectTo ? { emailRedirectTo } : undefined
    });

    if (error) {
      setError(error.message);
    } else if (!emailConfirmationEnabled && data.session) {
      router.replace('/onboarding/role');
    } else {
      setMessage('Проверьте почту, чтобы подтвердить адрес и завершить регистрацию.');
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Регистрация</h1>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            required
            name="email"
            type="email"
            className="w-full rounded-md border border-gray-300 p-2"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Пароль</span>
          <input
            required
            name="password"
            type="password"
            className="w-full rounded-md border border-gray-300 p-2"
            placeholder="••••••••"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-black py-2 text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Создаём…' : 'Зарегистрироваться'}
        </button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {message ? <p className="text-sm text-green-600">{message}</p> : null}
      </form>
    </main>
  );
};

export default SignUpPage;
