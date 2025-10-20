// @ts-nocheck
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { SelectionChip } from '../../components/onboarding/SelectionChip';
import { INTERESTS } from '../../content/constants';
import { loadDraft, saveDraft } from '../../lib/onboardingDraft';

export default function TravelerPage() {
  const router = useRouter();
  const [interests, setInterests] = useState([]);
  const [aboutTrip, setAboutTrip] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft.role !== 'traveler') {
      router.replace('/onboarding/role');
      return;
    }
    const meta = draft.traveler_meta || {};
    setInterests(Array.isArray(meta.interests) ? meta.interests : []);
    setAboutTrip(meta.aboutTrip || '');
  }, [router]);

  const toggleInterest = (value) => {
    setInterests((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    saveDraft({
      traveler_meta: {
        interests,
        aboutTrip
      }
    });
    await router.replace('/profile');
    setSaving(false);
  };

  return (
    <>
      <Head>
        <title>Домик — интересы путешественника</title>
      </Head>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-12">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-fg sm:text-4xl">Что вам интересно в поездке?</h1>
          <p className="text-base text-fg/70">Поделитесь ожиданиями, чтобы хозяева могли предложить подходящий опыт.</p>
        </div>
        <form onSubmit={handleSubmit} className="glass rounded-3xl border border-white/15 p-6 shadow-glass space-y-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-fg/80">Интересы</span>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((item) => (
                <SelectionChip
                  key={item}
                  label={item}
                  selected={interests.includes(item)}
                  onClick={() => toggleInterest(item)}
                />
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm text-fg/80">
            Что хотите сделать
            <Textarea
              value={aboutTrip}
              onChange={(event) => setAboutTrip(event.target.value)}
              placeholder="Расскажите о планах или ограничениях"
              rows={4}
            />
          </label>
          <div className="flex items-center justify-between">
            <Button type="button" variant="glass" onClick={() => router.push('/onboarding/profile')}>
              Назад
            </Button>
            <Button type="submit" variant="solid" disabled={saving}>
              Завершить
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
