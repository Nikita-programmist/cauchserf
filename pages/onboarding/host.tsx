import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { AVAILABLE_AMENITIES } from '../../content/constants';
import { loadDraft, saveDraft } from '../../lib/onboardingDraft';

export default function OnboardingHostPage() {
  const router = useRouter();
  const [maxGuests, setMaxGuests] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [rules, setRules] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft.role !== 'host') {
      router.replace('/onboarding/role');
      return;
    }

    const hostMeta = draft.host_meta || {};
    setMaxGuests(
      typeof hostMeta.maxGuests === 'number' && !Number.isNaN(hostMeta.maxGuests) ? String(hostMeta.maxGuests) : ''
    );
    setAmenities(Array.isArray(hostMeta.amenities) ? hostMeta.amenities : []);
    setRules(typeof hostMeta.rules === 'string' ? hostMeta.rules : '');
  }, [router]);

  const allAmenities = useMemo(() => {
    const extras = amenities.filter((item) => !AVAILABLE_AMENITIES.includes(item));
    return [...AVAILABLE_AMENITIES, ...extras];
  }, [amenities]);

  const toggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleFinish = () => {
    setIsSaving(true);

    const parsedGuests = maxGuests.trim();
    const guestsNumber = parsedGuests ? Number(parsedGuests) : undefined;

    saveDraft({
      host_meta: {
        maxGuests: typeof guestsNumber === 'number' && !Number.isNaN(guestsNumber) ? guestsNumber : undefined,
        amenities,
        rules: rules.trim()
      }
    });

    router.push('/profile');
  };

  return (
    <>
      <Head>
        <title>Онбординг — детали для хозяев | Домик</title>
      </Head>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-fg sm:text-4xl">Подготовьте пространство для гостей</h1>
          <p className="text-base text-fg/75">Расскажите, кого готовы принять и какие удобства доступны.</p>
        </div>

        <div className="glass space-y-6 rounded-3xl border border-white/10 px-6 py-8">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label htmlFor="maxGuests" className="text-sm font-medium text-fg/80">
                Максимум гостей
              </label>
              <Input
                id="maxGuests"
                name="maxGuests"
                type="number"
                min={1}
                placeholder="Например, 2"
                value={maxGuests}
                onChange={(event) => setMaxGuests(event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-fg/80">Удобства</p>
              <div className="flex flex-wrap gap-2">
                {allAmenities.map((amenity) => {
                  const isActive = amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        isActive
                          ? 'bg-white/80 text-fg shadow-glass'
                          : 'bg-white/5 text-fg/80 hover:bg-white/10'
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="rules" className="text-sm font-medium text-fg/80">
                Правила
              </label>
              <Textarea
                id="rules"
                name="rules"
                placeholder="Что важно знать гостю"
                value={rules}
                onChange={(event) => setRules(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => router.push('/onboarding/profile')} disabled={isSaving}>
              Назад
            </Button>
            <Button type="button" onClick={handleFinish} disabled={isSaving} className="min-w-[160px]">
              Завершить
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
