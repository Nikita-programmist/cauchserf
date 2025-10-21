import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { getServerSupabaseClient } from '../lib/supabaseServer';

const languageOptions = ['Русский', 'Английский', 'Испанский', 'Французский', 'Немецкий', 'Итальянский'];

export default function ProfilePage({ initialProfile, hasSupabaseEnv }) {
  const { supabase, user } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState(initialProfile?.role ?? '');
  const [city, setCity] = useState(initialProfile?.city ?? '');
  const [languages, setLanguages] = useState(initialProfile?.languages ?? []);
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? '');
  const [bio, setBio] = useState(initialProfile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url ?? '');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user && hasSupabaseEnv) {
      router.replace('/signin');
    }
  }, [hasSupabaseEnv, router, user]);

  const roleLabel = useMemo(() => (role === 'host' ? 'Хозяин' : role === 'guest' ? 'Гость' : ''), [role]);

  const toggleLanguage = (language) => {
    setLanguages((prev) => {
      if (prev?.includes(language)) {
        return prev.filter((item) => item !== language);
      }
      return [...(prev ?? []), language];
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!supabase || !user) return;
    setSaving(true);
    setStatus('');
    setError('');
    const { error: upsertError } = await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        role,
        city,
        languages,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );
    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setStatus('Профиль обновлён.');
  };

  return (
    <>
      <Head>
        <title>Профиль — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6">
        <div className="glass flex flex-col gap-6 px-8 py-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-fg">Ваш профиль</h1>
            <p className="text-sm text-fg/70">Обновите информацию о себе, чтобы путешественники знали, чего ожидать.</p>
          </div>
          {!hasSupabaseEnv ? (
            <p className="text-sm text-red-500">Supabase env не настроены (URL/KEY).</p>
          ) : null}
          {roleLabel ? (
            <span className="self-start rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-fg/80">
              {roleLabel}
            </span>
          ) : null}
          {status ? <p className="text-sm text-emerald-500">{status}</p> : null}
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <form className="flex flex-col gap-5" onSubmit={handleSave}>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole('host')}
                className={`rounded-xl border px-4 py-4 text-left transition hover:border-white/40 hover:bg-white/5 ${
                  role === 'host' ? 'border-white/70 bg-white/10' : 'border-white/20'
                }`}
                disabled={!hasSupabaseEnv}
              >
                <h2 className="text-base font-semibold text-fg">Я хозяин</h2>
                <p className="mt-1 text-xs text-fg/70">Принимаю гостей и делюсь местным опытом.</p>
              </button>
              <button
                type="button"
                onClick={() => setRole('guest')}
                className={`rounded-xl border px-4 py-4 text-left transition hover:border-white/40 hover:bg-white/5 ${
                  role === 'guest' ? 'border-white/70 bg-white/10' : 'border-white/20'
                }`}
                disabled={!hasSupabaseEnv}
              >
                <h2 className="text-base font-semibold text-fg">Я гость</h2>
                <p className="mt-1 text-xs text-fg/70">Путешествую и ищу тёплые знакомства.</p>
              </button>
            </div>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Город
              <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Москва" />
            </label>
            <div className="flex flex-col gap-3">
              <span className="text-sm text-fg/80">Я говорю на</span>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((language) => {
                  const active = languages?.includes(language);
                  return (
                    <button
                      key={language}
                      type="button"
                      onClick={() => toggleLanguage(language)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? 'border-white/70 bg-white/15 text-fg'
                          : 'border-white/20 text-fg/80 hover:border-white/40 hover:bg-white/5'
                      }`}
                    >
                      {language}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Имя
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Мария" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Коротко о себе
              <Textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Расскажите о себе, чтобы гостям было легче выбрать вас."
                rows={4}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              URL аватара
              <Input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." />
            </label>
            <Button type="submit" disabled={!hasSupabaseEnv || saving || !role || !fullName}>
              {saving ? 'Сохраняем...' : 'Сохранить изменения'}
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const supabase = getServerSupabaseClient(ctx);

  if (!supabase) {
    return {
      props: {
        initialProfile: null,
        initialSession: null,
        hasSupabaseEnv: false
      }
    };
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: '/signin',
        permanent: false
      }
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, city, languages, full_name, bio, avatar_url')
    .eq('user_id', session.user.id)
    .maybeSingle();

  return {
    props: {
      initialProfile: profile ?? null,
      initialSession: session,
      hasSupabaseEnv: true
    }
  };
}
