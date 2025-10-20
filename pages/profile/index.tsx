import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { AVAILABLE_AMENITIES, AVAILABLE_INTERESTS, AVAILABLE_LANGUAGES } from '../../content/constants';
import { clearDraft, loadDraft, OnboardingDraft } from '../../lib/onboardingDraft';

const roleLabels: Record<Exclude<OnboardingDraft['role'], null>, string> = {
  host: 'Хозяин',
  traveler: 'Гость'
};

function formatList(values: string[], reference: string[]) {
  if (!values.length) {
    return 'Не указано';
  }

  const ordered = [...values].sort((a, b) => {
    const aIndex = reference.indexOf(a);
    const bIndex = reference.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return ordered.join(', ');
}

export default function ProfilePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  const handleClear = () => {
    clearDraft();
    router.push('/onboarding/role');
  };

  return (
    <>
      <Head>
        <title>Профиль — черновик | Домик</title>
      </Head>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="glass space-y-8 rounded-3xl border border-white/10 px-6 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-fg sm:text-4xl">Профиль</h1>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fg/80">
                  Черновик (локально)
                </span>
              </div>
              <p className="text-sm text-fg/70">
                Данные хранятся только в вашем браузере. Сбросьте их, если хотите заполнить анкету заново.
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={handleClear}>
              Очистить черновик
            </Button>
          </div>

          {draft ? (
            <div className="space-y-8">
              <section className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6">
                {draft.avatar_url ? (
                  <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                    <img
                      src={draft.avatar_url}
                      alt={draft.display_name || 'Аватар пользователя'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-3xl text-fg/60">
                    {draft.display_name ? draft.display_name.charAt(0).toUpperCase() : '🙂'}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-fg">{draft.display_name || 'Имя не указано'}</h2>
                    <p className="text-sm text-fg/70">
                      {draft.role ? roleLabels[draft.role] : 'Роль не выбрана'}
                      {draft.city ? ` · ${draft.city}` : ''}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-fg/80">{draft.bio || 'Биография пока пустая.'}</p>
                  <p className="text-sm text-fg/70">
                    Языки: {formatList(draft.languages || [], AVAILABLE_LANGUAGES)}
                  </p>
                </div>
              </section>

              {draft.role === 'host' ? (
                <section className="space-y-3">
                  <h3 className="text-xl font-semibold text-fg">Данные для гостей</h3>
                  <div className="space-y-2 text-sm text-fg/80">
                    <p>
                      Максимум гостей:{' '}
                      {draft.host_meta.maxGuests && !Number.isNaN(draft.host_meta.maxGuests)
                        ? draft.host_meta.maxGuests
                        : 'Не указано'}
                    </p>
                    <p>Удобства: {formatList(draft.host_meta.amenities || [], AVAILABLE_AMENITIES)}</p>
                    <p>Правила: {draft.host_meta.rules ? draft.host_meta.rules : 'Не указано'}</p>
                  </div>
                </section>
              ) : null}

              {draft.role === 'traveler' ? (
                <section className="space-y-3">
                  <h3 className="text-xl font-semibold text-fg">Интересы путешественника</h3>
                  <div className="space-y-2 text-sm text-fg/80">
                    <p>Что нравится: {formatList(draft.traveler_meta.interests || [], AVAILABLE_INTERESTS)}</p>
                    <p>О поездке: {draft.traveler_meta.aboutTrip ? draft.traveler_meta.aboutTrip : 'Не указано'}</p>
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-fg/70">Загружаем данные профиля…</p>
          )}
        </div>
      </div>
    </>
  );
}
