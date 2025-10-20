// @ts-nocheck
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { SelectionChip } from '../../components/onboarding/SelectionChip';
import { loadDraft, saveDraft } from '../../lib/onboardingDraft';

const roles = [
  { key: 'host', title: 'Я принимаю гостей', description: 'Расскажите о своём жилье и правилах приёма путешественников.' },
  { key: 'traveler', title: 'Я путешествую', description: 'Поделитесь интересами, чтобы хозяева понимали ваши ожидания.' }
];

export default function RolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft.role) {
      setSelected(draft.role);
    }
  }, []);

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);
    saveDraft({ role: selected });
    await router.push('/onboarding/profile');
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Домик — выбор роли</title>
      </Head>
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-fg sm:text-4xl">С кем вы хотите путешествовать?</h1>
          <p className="text-base text-fg/70">Выберите роль, чтобы мы подстроили вопросы под ваш сценарий.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map((role) => (
            <Card
              key={role.key}
              className={`cursor-pointer transition ${selected === role.key ? 'border-accent/60 bg-white/10' : 'bg-white/5 hover:bg-white/10'}`}
              onClick={() => setSelected(role.key)}
            >
              <CardHeader>
                <CardTitle>{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <SelectionChip label={selected === role.key ? 'Вы выбрали' : 'Выбрать'} selected={selected === role.key} />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <Button onClick={handleNext} disabled={!selected || loading} variant="solid">
            Дальше
          </Button>
        </div>
      </div>
    </>
  );
}
