// @ts-nocheck
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { SelectionChip } from '../../components/onboarding/SelectionChip';
import { AMENITIES } from '../../content/constants';
import { loadDraft, saveDraft } from '../../lib/onboardingDraft';

export default function HostPage() {
  const router = useRouter();
  const [maxGuests, setMaxGuests] = useState('');
  const [amenities, setAmenities] = useState([]);
  const [rules, setRules] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft.role !== 'host') {
      router.replace('/onboarding/role');
      return;
    }
    const meta = draft.host_meta || {};
    setMaxGuests(meta.maxGuests ? String(meta.maxGuests) : '');
    setAmenities(Array.isArray(meta.amenities) ? meta.amenities : []);
    setRules(meta.rules || '');
  }, [router]);

  const toggleAmenity = (value) => {
    setAmenities((prev) => {
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
      host_meta: {
        maxGuests: maxGuests ? Number(maxGuests) : undefined,
        amenities,
        rules
      }
    });
    await router.replace('/profile');
    setSaving(false);
  };

  return (
    <>
      <Head>
        <title>Домик — условия приёма гостей</title>
      </Head>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-12">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-fg sm:text-4xl">Параметры жилья</h1>
          <p className="text-base text-fg/70">Поделитесь деталями, чтобы путешественники понимали условия проживания.</p>
        </div>
        <form onSubmit={handleSubmit} className="glass rounded-3xl border border-white/15 p-6 shadow-glass space-y-5">
          <label className="flex flex-col gap-1 text-sm text-fg/80">
            Максимум гостей
            <Input
              type="number"
              min="1"
              value={maxGuests}
              onChange={(event) => setMaxGuests(event.target.value)}
              placeholder="Например, 2"
            />
          </label>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-fg/80">Удобства</span>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((item) => (
                <SelectionChip
                  key={item}
                  label={item}
                  selected={amenities.includes(item)}
                  onClick={() => toggleAmenity(item)}
                />
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm text-fg/80">
            Правила
            <Textarea
              value={rules}
              onChange={(event) => setRules(event.target.value)}
              placeholder="Расскажите о правилах и ожиданиях"
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
