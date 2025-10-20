// @ts-nocheck
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { loadDraft, clearDraft } from '../../lib/onboardingDraft';

const valueOrDash = (value) => {
  if (Array.isArray(value) && value.length === 0) return '—';
  if (typeof value === 'string' && !value) return '—';
  if (value === null || value === undefined) return '—';
  return value;
};

export default function ProfileSummaryPage() {
  const router = useRouter();
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  const handleClear = () => {
    clearDraft();
    setDraft(null);
    router.replace('/onboarding/role');
  };

  return (
    <>
      <Head>
        <title>Домик — черновик профиля</title>
      </Head>
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-fg sm:text-4xl">Черновик профиля</h1>
            <p className="text-base text-fg/70">Данные сохраняются локально, вы можете вернуться и отредактировать их позже.</p>
          </div>
          <Button variant="glass" onClick={handleClear}>
            Очистить черновик
          </Button>
        </div>

        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Общая информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-fg/80">
                <div>
                  <span className="block text-xs uppercase tracking-wide text-fg/60">Роль</span>
                  <span>{draft.role === 'host' ? 'Хозяин' : draft.role === 'traveler' ? 'Путешественник' : '—'}</span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wide text-fg/60">Имя</span>
                  <span>{valueOrDash(draft.display_name)}</span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wide text-fg/60">Город</span>
                  <span>{valueOrDash(draft.city)}</span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wide text-fg/60">Языки</span>
                  <span>{draft.languages && draft.languages.length ? draft.languages.join(', ') : '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>О себе</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-fg/80">
                <div>
                  <span className="block text-xs uppercase tracking-wide text-fg/60">Био</span>
                  <span>{valueOrDash(draft.bio)}</span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wide text-fg/60">Аватар</span>
                  <span>{valueOrDash(draft.avatar_url)}</span>
                </div>
              </CardContent>
            </Card>

            {draft.role === 'host' && (
              <Card className="sm:col-span-2">
                <CardHeader>
                  <CardTitle>Детали жилья</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-fg/80">
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-fg/60">Гостей максимум</span>
                    <span>{draft.host_meta?.maxGuests ?? '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-fg/60">Удобства</span>
                    <span>
                      {draft.host_meta?.amenities && draft.host_meta.amenities.length
                        ? draft.host_meta.amenities.join(', ')
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-fg/60">Правила</span>
                    <span>{valueOrDash(draft.host_meta?.rules)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {draft.role === 'traveler' && (
              <Card className="sm:col-span-2">
                <CardHeader>
                  <CardTitle>Пожелания путешествия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-fg/80">
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-fg/60">Интересы</span>
                    <span>
                      {draft.traveler_meta?.interests && draft.traveler_meta.interests.length
                        ? draft.traveler_meta.interests.join(', ')
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-fg/60">О поездке</span>
                    <span>{valueOrDash(draft.traveler_meta?.aboutTrip)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="glass rounded-3xl border border-white/15 p-6 text-center text-fg/70">
            Черновик пуст — начните с выбора роли.
          </div>
        )}
      </div>
    </>
  );
}
