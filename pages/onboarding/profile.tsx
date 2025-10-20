// @ts-nocheck
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { SelectionChip } from '../../components/onboarding/SelectionChip';
import { LANGS } from '../../content/constants';
import { loadDraft, saveDraft } from '../../lib/onboardingDraft';

export default function ProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [languages, setLanguages] = useState([]);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft.role) {
      router.replace('/onboarding/role');
      return;
    }
    setRole(draft.role);
    setDisplayName(draft.display_name || '');
    setCity(draft.city || '');
    setLanguages(Array.isArray(draft.languages) ? draft.languages : []);
    setBio(draft.bio || '');
    setAvatarUrl(draft.avatar_url || '');
  }, [router]);

  const toggleLanguage = (lang) => {
    setLanguages((prev) => {
      if (prev.includes(lang)) {
        return prev.filter((item) => item !== lang);
      }
      return [...prev, lang];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!displayName) return;
    setSaving(true);
    saveDraft({
      role,
      display_name: displayName,
      city,
      languages,
      bio,
      avatar_url: avatarUrl
    });
    if (role === 'host') {
      await router.push('/onboarding/host');
    } else if (role === 'traveler') {
      await router.push('/onboarding/traveler');
    } else {
      await router.push('/onboarding/role');
    }
    setSaving(false);
  };

  return (
    <>
      <Head>
        <title>Домик — профиль участника</title>
      </Head>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-12">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-fg sm:text-4xl">Расскажите о себе</h1>
          <p className="text-base text-fg/70">Это поможет сообществу понять, как с вами связаться и что вам интересно.</p>
        </div>
        <form onSubmit={handleSubmit} className="glass rounded-3xl border border-white/15 p-6 shadow-glass space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-fg/80">
              Имя *
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required placeholder="Как к вам обращаться" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-fg/80">
              Город
              <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Где вы живёте" />
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-fg/80">Языки</span>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((lang) => (
                <SelectionChip
                  key={lang}
                  label={lang}
                  selected={languages.includes(lang)}
                  onClick={() => toggleLanguage(lang)}
                />
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm text-fg/80">
            О себе
            <Textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Коротко о ваших привычках и планах" rows={4} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-fg/80">
            Ссылка на аватар
            <Input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://" type="url" />
          </label>
          <div className="flex items-center justify-between">
            <Button type="button" variant="glass" onClick={() => router.push('/onboarding/role')}>
              Назад
            </Button>
            <Button type="submit" variant="solid" disabled={!displayName || saving}>
              Дальше
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
