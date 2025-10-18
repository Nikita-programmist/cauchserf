import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { getServerSupabaseClient } from '../lib/supabaseServer';

const languageOptions = ['Русский', 'Английский', 'Испанский', 'Французский', 'Немецкий', 'Итальянский'];

export default function OnboardingPage({ initialProfile, hasSupabaseEnv }) {
  const { supabase, user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [role, setRole] = useState(initialProfile?.role ?? '');
  const [city, setCity] = useState(initialProfile?.city ?? '');
  const [languages, setLanguages] = useState(initialProfile?.languages ?? []);
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? '');
  const [bio, setBio] = useState(initialProfile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url ?? '');

  const initialStep = useMemo(() => {
    if (!role) return 1;
    if (!city || !languages?.length) return 2;
    return 3;
  }, [role, city, languages]);

  const [step, setStep] = useState(initialStep);

  const toggleLanguage = (language) => {
    setLanguages((prev) => {
      if (prev?.includes(language)) {
        return prev.filter((item) => item !== language);
      }
      return [...(prev ?? []), language];
    });
  };

  const saveProfile = async (updates) => {
    if (!supabase || !user) return;
    setSaving(true);
    setError('');
    const { error: upsertError } = await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );
    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return false;
    }
    return true;
  };

  const handleRoleSelect = async (value) => {
    setRole(value);
    const success = await saveProfile({ role: value });
    if (success) {
      setStep(2);
    }
  };

  const handleStepTwo = async (event) => {
    event.preventDefault();
    const success = await saveProfile({ city, languages });
    if (success) {
      setStep(3);
    }
  };

  const handleFinish = async (event) => {
    event.preventDefault();
    const success = await saveProfile({ full_name: fullName, bio, avatar_url: avatarUrl });
    if (success) {
      router.replace('/profile');
    }
  };

  const stepTitle = step === 1 ? 'Выберите роль' : step === 2 ? 'Расскажите о себе' : 'Завершите профиль';

  return (
    <>
      <Head>
        <title>Онбординг — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6">
        <div className="glass flex flex-col gap-6 px-8 py-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Шаг {step} из 3</p>
            <h1 className="mt-2 text-2xl font-semibold text-fg">{stepTitle}</h1>
            <p className="text-sm text-fg/70">Мы настроим ваш профиль, чтобы путешествия были безопасными и тёплыми.</p>
          </div>
          {!hasSupabaseEnv ? (
            <p className="text-sm text-red-500">Supabase env не настроены (URL/KEY).</p>
          ) : null}
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('host')}
                className={`rounded-2xl border px-6 py-6 text-left transition hover:border-white/40 hover:bg-white/5 ${
                  role === 'host' ? 'border-white/70 bg-white/10' : 'border-white/20'
                }`}
                disabled={!hasSupabaseEnv || saving}
              >
                <h2 className="text-lg font-semibold text-fg">Я хозяин</h2>
                <p className="mt-2 text-sm text-fg/70">Готов принять гостей и поделиться атмосферой своего города.</p>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('guest')}
                className={`rounded-2xl border px-6 py-6 text-left transition hover:border-white/40 hover:bg-white/5 ${
                  role === 'guest' ? 'border-white/70 bg-white/10' : 'border-white/20'
                }`}
                disabled={!hasSupabaseEnv || saving}
              >
                <h2 className="text-lg font-semibold text-fg">Я гость</h2>
                <p className="mt-2 text-sm text-fg/70">Ищу уютный уголок и интересных людей для общения.</p>
              </button>
            </div>
          ) : null}
          {step === 2 ? (
            <form className="flex flex-col gap-5" onSubmit={handleStepTwo}>
              <label className="flex flex-col gap-2 text-sm text-fg/80">
                Город
                <Input
                  placeholder="Москва"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  required
                />
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
              <div className="flex justify-between gap-3">
                <Button variant="ghost" type="button" onClick={() => setStep(1)}>
                  Назад
                </Button>
                <Button type="submit" disabled={!hasSupabaseEnv || saving || !city || !languages?.length}>
                  {saving ? 'Сохраняем...' : 'Далее'}
                </Button>
              </div>
            </form>
          ) : null}
          {step === 3 ? (
            <form className="flex flex-col gap-5" onSubmit={handleFinish}>
              <label className="flex flex-col gap-2 text-sm text-fg/80">
                Имя
                <Input
                  placeholder="Мария"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-fg/80">
                Коротко о себе
                <Textarea
                  placeholder="Расскажите, чем вы увлекаетесь, и что любите в гостях."
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-fg/80">
                URL аватара
                <Input
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                />
              </label>
              <div className="flex justify-between gap-3">
                <Button variant="ghost" type="button" onClick={() => setStep(2)}>
                  Назад
                </Button>
                <Button type="submit" disabled={!hasSupabaseEnv || saving || !fullName}>
                  {saving ? 'Сохраняем...' : 'Завершить'}
                </Button>
              </div>
            </form>
          ) : null}
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
