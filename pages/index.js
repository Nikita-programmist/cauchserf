import Head from 'next/head';
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

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

const testimonials = [
  {
    quote: 'Стеклянные карточки делают интерфейс лёгким и понятным. Теперь поиск жилья занимает минуты.',
    author: 'Ольга, дизайнер'
  },
  {
    quote: 'Мне нравится, что акценты тёплые, а сам интерфейс будто подсвечивается изнутри.',
    author: 'Иван, разработчик'
  }
];

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);

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

          <section id="guides" className="space-y-10">
            <header className="max-w-3xl space-y-3">
              <h2 className="text-3xl font-semibold text-fg sm:text-4xl">Прозрачные сценарии путешествий</h2>
              <p className="text-base text-fg/75">
                Мы собрали ключевые сценарии сервиса и адаптировали их к новой стеклянной системе «Домик». Каждый блок легко
                комбинируется и сохраняет единый визуальный стиль.
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
              <h2 className="text-3xl font-semibold text-fg sm:text-4xl">Истории путешественников</h2>
              <p className="text-base text-fg/75">
                Карточки отзывов используют усиленный стеклянный стиль, чтобы тексты оставались читаемыми на фоне световых
                пятен.
              </p>
            </header>
            <div className="grid gap-6 md:grid-cols-2">
              {testimonials.map((item) => (
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
        <footer className="glass mx-auto flex w-full max-w-4xl flex-col items-center gap-2 rounded-2xl px-6 py-5 text-center text-sm text-fg/70">
          <p>© {new Date().getFullYear()} Домик. Путешествуйте ответственно.</p>
          <p className="text-xs">
            Стеклянная тема использует согласованные переменные и доступные цвета для контраста 4.5:1.
          </p>
        </footer>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Команда Домика"
        description="Оставьте заявку — мы поможем подобрать формат участия."
      >
        <p className="text-sm text-fg/80">
          Менеджер сообщества свяжется с вами в течение 24 часов. Мы ценим прозрачность: все действия фиксируются в вашей
          панели.
        </p>
      </Dialog>
    </>
  );
}
