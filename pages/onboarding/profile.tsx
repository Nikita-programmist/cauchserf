import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { AVAILABLE_LANGUAGES } from '../../content/constants';
import { loadDraft, saveDraft, OnboardingDraft } from '../../lib/onboardingDraft';

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedDraft = loadDraft();
    if (!storedDraft.role) {
      setError('Выберите роль');
    }
    setDraft(storedDraft);
    setDisplayName(storedDraft.display_name || '');
    setCity(storedDraft.city || '');
    setLanguages(storedDraft.languages || []);
    setBio(storedDraft.bio || '');
    setAvatarUrl(storedDraft.avatar_url || '');
  }, []);

  const allLanguages = useMemo(() => {
    const extras = languages.filter((item) => !AVAILABLE_LANGUAGES.includes(item));
    return [...AVAILABLE_LANGUAGES, ...extras];
  }, [languages]);

  const toggleLanguage = (value: string) => {
    setLanguages((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleNext = () => {
    setError('');
    if (!displayName.trim()) {
      setError('Укажите отображаемое имя');
      return;
    }

    if (!draft?.role) {
      setError('Выберите роль');
      return;
    }

    setIsSaving(true);
    const updated = saveDraft({
      display_name: displayName.trim(),
      city: city.trim(),
      languages,
      bio: bio.trim(),
      avatar_url: avatarUrl.trim()
    });

    if (updated.role === 'host') {
      router.push('/onboarding/host');
      return;
    }

    if (updated.role === 'traveler') {
      router.push('/onboarding/traveler');
      return;
    }

    setIsSaving(false);
    setError('Выберите роль');
  };

  return (
    <>
      <Head>
        <title>Онбординг — профиль | Домик</title>
      </Head>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-fg sm:text-4xl">Расскажите о себе</h1>
          <p className="text-base text-fg/75">Эти данные увидят ваши будущие гости или хозяева.</p>
        </div>

        <form className="glass space-y-6 rounded-3xl border border-white/10 px-6 py-8" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-6">
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium text-fg/80">
                Имя, которое видят остальные
              </label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Например, Алена из Казани"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium text-fg/80">
                Город
              </label>
              <Input id="city" name="city" placeholder="Где вы сейчас" value={city} onChange={(event) => setCity(event.target.value)} />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-fg/80">Языки</p>
              <div className="flex flex-wrap gap-2">
                {allLanguages.map((language) => {
                  const isActive = languages.includes(language);
                  return (
                    <button
                      key={language}
                      type="button"
                      onClick={() => toggleLanguage(language)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        isActive
                          ? 'bg-white/80 text-fg shadow-glass'
                          : 'bg-white/5 text-fg/80 hover:bg-white/10'
                      }`}
                    >
                      {language}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium text-fg/80">
                О себе
              </label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Расскажите, чем увлекаетесь"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="avatarUrl" className="text-sm font-medium text-fg/80">
                Ссылка на аватар
              </label>
              <Input
                id="avatarUrl"
                name="avatarUrl"
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
              />
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-red-300">{error}</p> : null}

          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => router.push('/onboarding/role')} disabled={isSaving}>
              Назад
            </Button>
            <Button type="button" onClick={handleNext} disabled={isSaving} className="min-w-[160px]">
              Дальше
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
