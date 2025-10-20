import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { loadDraft, saveDraft, OnboardingRole } from '../../lib/onboardingDraft';

const roleOptions: { value: Exclude<OnboardingRole, null>; label: string; description: string }[] = [
  { value: 'traveler', label: 'Гость', description: 'Для тех, кто ищет жильё и локальные впечатления.' },
  { value: 'host', label: 'Хозяин', description: 'Для тех, кто готов принимать гостей и делиться городом.' }
];

export default function OnboardingRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<OnboardingRole>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const draft = loadDraft();
    setSelectedRole(draft.role);
  }, []);

  const handleSelect = (role: Exclude<OnboardingRole, null>) => {
    setSelectedRole(role);
    setError('');
    saveDraft({ role });
  };

  const hasError = useMemo(() => !selectedRole && Boolean(error), [selectedRole, error]);

  const handleNext = () => {
    if (!selectedRole) {
      setError('Выберите роль');
      return;
    }

    setIsSaving(true);
    saveDraft({ role: selectedRole });
    router.push('/onboarding/profile');
  };

  return (
    <>
      <Head>
        <title>Онбординг — выбор роли | Домик</title>
      </Head>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold text-fg sm:text-4xl">Кем вы будете пользоваться Домиком?</h1>
          <p className="text-base text-fg/75">Выберите сценарий, который подходит вам сейчас. Его всегда можно поменять позднее.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {roleOptions.map((option) => {
            const isSelected = selectedRole === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`glass group flex h-full flex-col justify-between gap-3 rounded-3xl border border-white/10 px-6 py-6 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isSelected ? 'ring-2 ring-accent/80' : hasError ? 'ring-2 ring-red-400/70' : 'ring-0'
                }`}
              >
                <span className="text-2xl font-semibold text-fg">{option.label}</span>
                <span className="text-sm text-fg/75">{option.description}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          {hasError ? <p className="text-sm font-medium text-red-300">{error}</p> : <span />}
          <Button type="button" onClick={handleNext} disabled={isSaving} className="min-w-[160px]">
            Дальше
          </Button>
        </div>
      </div>
    </>
  );
}
