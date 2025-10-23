import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabaseClient';

const genderLabels = {
  male: 'Мужской',
  female: 'Женский',
  other: 'Другое'
};

const roleLabels = {
  host: 'Хозяин',
  traveler: 'Путешественник'
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!isActive) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, first_name, last_name, city, bio, avatar_url, age, gender, beds')
        .eq('id', user.id)
        .maybeSingle();

      if (!isActive) return;

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        router.replace('/onboarding/choose-role');
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const fullName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : '';
  const roleLabel = profile ? roleLabels[profile.role] ?? '—' : '—';
  const genderLabel = profile ? genderLabels[profile.gender] ?? null : null;
  const ageDisplay = profile && profile.age !== null && profile.age !== undefined ? profile.age : '—';
  const bedsDisplay = profile && profile.beds !== null && profile.beds !== undefined ? profile.beds : '—';

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-sm px-6 py-8 text-center text-sm text-fg/70">Загружаем профиль…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass w-full max-w-sm px-6 py-8 text-center text-sm text-red-400">{error}</div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Профиль — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6">
        <div className="glass flex flex-col gap-6 px-8 py-10">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Ваш профиль</p>
            <h1 className="text-2xl font-semibold text-fg">{fullName || 'Без имени'}</h1>
            <span className="inline-flex w-max rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-fg/80">
              {roleLabel}
            </span>
          </div>
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex-shrink-0">
              <div className="h-32 w-32 overflow-hidden rounded-2xl border border-white/20 bg-white/5">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Аватар" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-fg/60">Нет фото</div>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 text-sm text-fg/80">
              <div>
                <p className="text-xs uppercase tracking-wide text-fg/60">Город</p>
                <p className="mt-1 text-base text-fg">{profile?.city || '—'}</p>
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-fg/60">Возраст</p>
                  <p className="mt-1 text-base text-fg">{ageDisplay}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-fg/60">Пол</p>
                  <p className="mt-1 text-base text-fg">{genderLabel || '—'}</p>
                </div>
                {profile?.role === 'host' ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-fg/60">Спальных мест</p>
                    <p className="mt-1 text-base text-fg">{bedsDisplay}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-fg/60">О себе</p>
            <p className="mt-2 text-sm text-fg/80">{profile?.bio || 'Нет описания'}</p>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link
              href="/profile/edit"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-2 text-sm font-semibold text-fg transition hover:border-white/60 hover:bg-white/10"
            >
              Редактировать
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-xl bg-white/80 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
            >
              Выйти
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
