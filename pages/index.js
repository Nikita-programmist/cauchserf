import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { TESTIMONIALS } from '../content/testimonials';
import { useAuth } from '../components/AuthProvider';
import ChatWindow from '../components/chat/ChatWindow';

const journeys = [
  {
    title: 'Совместные впечатления',
    description: 'Организуйте прогулки, ужины и поездки с хозяином, чтобы лучше узнать город.'
  },
  {
    title: 'Культурный обмен',
    description: 'Домик помогает путешественникам погружаться в локальную культуру и делиться своей.'
  },
  {
    title: 'Приватность под контролем',
    description: 'Вы решаете, какие данные показывать гостям или хозяевам, а какие остаются только вам.'
  }
];

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const { user, loading: authLoading, hasSupabaseEnv } = useAuth();

  useEffect(() => {
    if (!user) {
      setConversationId(null);
      return;
    }

    let active = true;
    setChatLoading(true);

    (async () => {
      try {
        const res = await fetch('/api/conversations', {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to load conversations');
        }
        const data = await res.json();
        if (!active) return;
        const firstConversation = data?.conversations?.[0]
          ?? (Array.isArray(data) ? data[0] : null);
        const resolvedId = firstConversation?.conversationId
          ?? firstConversation?.id
          ?? null;
        setConversationId(resolvedId);
      } catch (err) {
        if (active) {
          setConversationId(null);
        }
      } finally {
        if (active) {
          setChatLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <>
      <Head>
        <title>Домик — стеклянная платформа каучсерфинга</title>
        <meta
          name="description"
          content="Домик — современный сервис каучсерфинга со стеклянным стилем. Находите хозяев, путешествуйте и делитесь домом."
        />
      </Head>
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-20 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <Navbar />
        <main className="flex flex-1 flex-col gap-24">
          <Hero />

          <section id="community-chat" className="space-y-6">
            <header className="max-w-3xl space-y-3">
              <h2 className="text-3xl font-semibold text-fg sm:text-4xl">Чат сообщества</h2>
              <p className="text-base text-fg/75">
                Общайтесь с путешественниками и хозяевами сразу после входа. Обсуждайте поездки, уточняйте детали проживания и делитесь опытом напрямую в Домике.
              </p>
            </header>
            {!hasSupabaseEnv ? (
              <div className="glass-strong rounded-3xl p-6 text-sm text-fg/80">
                <p>Чат временно недоступен: настройте переменные окружения Supabase, чтобы активировать общение.</p>
              </div>
            ) : authLoading || chatLoading ? (
              <div className="glass-strong rounded-3xl p-6 text-sm text-fg/80">
                <p>Загружаем информацию о ваших диалогах…</p>
              </div>
            ) : user ? (
              <div className="glass-strong flex flex-col gap-4 rounded-3xl p-6 text-sm text-fg/80">
                {conversationId ? (
                  <div className="h-[420px] w-full max-w-3xl">
                    <ChatWindow conversationId={conversationId} />
                  </div>
                ) : (
                  <div className="text-sm text-fg/70">
                    Пока нет активных диалогов. Создайте заявку или отправьте сообщение, чтобы начать общение.
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-strong flex flex-col gap-4 rounded-3xl p-6 text-sm text-fg/80 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-base font-medium text-fg">Войдите, чтобы писать в личные чаты Домика.</p>
                  <p>Создайте аккаунт путешественника или хозяина и начните общение.</p>
                </div>
                <div className="flex flex-col gap-2 sm:min-w-[220px]">
                  <Button variant="solid" asChild>
                    <Link href="/login">Войти</Link>
                  </Button>
                  <Button variant="glass" asChild>
                    <Link href="/signup">Создать аккаунт</Link>
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section id="guides" className="space-y-10">
            <header className="max-w-3xl space-y-3">
              <h2 className="text-3xl font-semibold text-fg sm:text-4xl">Прозрачные сценарии путешествий</h2>
              <p className="text-base text-fg/75">
                Мы собрали ключевые сценарии сервиса и адаптировали их к новой стеклянной системе «Домик». Каждый блок легко комбинируется и сохраняет единый визуальный стиль.
              </p>
            </header>
            <div className="grid gap-6 md:grid-cols-3">
              {journeys.map((journey) => (
                <Card key={journey.title} className="flex h-full flex-col justify-between">
                  <CardHeader>
                    <CardTitle>{journey.title}</CardTitle>
                    <CardDescription>{journey.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="glass">Подробнее</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section id="stories" className="space-y-10">
            <header className="max-w-3xl space-y-3">
              <h2 className="text-3xl font-semibold text-fg sm:text-4xl">{TESTIMONIALS.title}</h2>
              <p className="text-base text-fg/75">{TESTIMONIALS.subtitle}</p>
            </header>
            <div className="grid gap-6 md:grid-cols-2">
              {TESTIMONIALS.items.map((item) => (
                <Card key={item.author} className="glass-strong h-full">
                  <CardContent className="space-y-4">
                    <p className="text-lg text-fg/90">“{item.quote}”</p>
                    <span className="text-sm font-medium text-fg">{item.author}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section id="contact" className="glass-strong relative overflow-hidden rounded-3xl p-8 text-fg shadow-glass">
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-accent/50 blur-3xl" aria-hidden="true" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold sm:text-4xl">Поддержка сообществом</h2>
                <p className="text-base text-fg/80">
                  Свяжитесь с командой «Домика», расскажите о городе и получите поддержку в запуске локальных инициатив.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="solid" onClick={() => setDialogOpen(true)}>
                    Связаться с нами
                  </Button>
                  <Button variant="glass">Гид по стилю</Button>
                </div>
              </div>
              <form className="glass space-y-4 rounded-2xl border border-white/15 p-6" aria-label="Форма обратной связи">
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-fg/90">
                    Имя
                  </label>
                  <Input id="name" name="name" placeholder="Ваше имя" required />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-fg/90">
                    Email
                  </label>
                  <Input id="email" type="email" name="email" placeholder="you@example.com" required />
                </div>
                <div>
                  <label htmlFor="idea" className="mb-1 block text-sm font-medium text-fg/90">
                    Идея
                  </label>
                  <Textarea id="idea" name="idea" placeholder="Опишите, что хотите развивать" />
                </div>
                <Button type="submit" variant="solid" className="w-full">
                  Отправить
                </Button>
              </form>
            </div>
          </section>
        </main>
        <footer className="glass mx-auto flex w-full max-w-4xl flex-col items-center rounded-2xl px-6 py-5 text-center text-sm text-fg/70">
          <p>© {new Date().getFullYear()} Домик. Путешествуйте ответственно.</p>
        </footer>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Команда Домика"
        description="Оставьте заявку — мы поможем подобрать формат участия."
      >
        <p className="text-sm text-fg/80">
          Менеджер сообщества свяжется с вами в течение 24 часов. Мы ценим прозрачность: все действия фиксируются в вашей панели.
        </p>
      </Dialog>
    </>
  );
}
