import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { AVAILABLE_INTERESTS } from '../../content/constants';
import { loadDraft, saveDraft } from '../../lib/onboardingDraft';

export default function OnboardingTravelerPage() {
  const router = useRouter();
  const [interests, setInterests] = useState<string[]>([]);
  const [aboutTrip, setAboutTrip] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft.role !== 'traveler') {
      router.replace('/onboarding/role');
      return;
    }

    const travelerMeta = draft.traveler_meta || {};
    setInterests(Array.isArray(travelerMeta.interests) ? travelerMeta.interests : []);
    setAboutTrip(typeof travelerMeta.aboutTrip === 'string' ? travelerMeta.aboutTrip : '');
  }, [router]);

  const allInterests = useMemo(() => {
    const extras = interests.filter((item) => !AVAILABLE_INTERESTS.includes(item));
    return [...AVAILABLE_INTERESTS, ...extras];
  }, [interests]);

  const toggleInterest = (value: string) => {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleFinish = () => {
    setIsSaving(true);
    saveDraft({
      traveler_meta: {
        interests,
        aboutTrip: aboutTrip.trim()
      }
    });
    router.push('/profile');
  };

  return (
    <>
      <Head>
        <title>Онбординг — ожидания путешествия | Домик</title>
      </Head>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-fg sm:text-4xl">Чего ждёте от поездки?</h1>
          <p className="text-base text-fg/75">Поделитесь интересами, чтобы хозяева могли предложить подходящие активности.</p>
        </div>

        <div className="glass space-y-6 rounded-3xl border border-white/10 px-6 py-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-fg/80">Интересы</p>
            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => {
                const isActive = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      isActive
                        ? 'bg-white/80 text-fg shadow-glass'
                        : 'bg-white/5 text-fg/80 hover:bg-white/10'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="aboutTrip" className="text-sm font-medium text-fg/80">
              Расскажите о планах
            </label>
            <Textarea
              id="aboutTrip"
              name="aboutTrip"
              placeholder="Какие впечатления ищете?"
              value={aboutTrip}
              onChange={(event) => setAboutTrip(event.target.value)}
            />
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
