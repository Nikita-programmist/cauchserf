import Head from 'next/head';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

export default function Home() {
  return (
    <div className="space-y-16">
      <Head>
        <meta
          name="description"
          content="Couchsurf.ru — сообщество для взаимного гостеприимства и приключений по всему миру."
        />
      </Head>

      <section className="grid gap-8 rounded-[var(--radius)] bg-card/60 p-10 shadow-soft-lg md:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Свобода путешествий
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Находите уютные дома и новых друзей через Couchsurf.ru
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Соединяем путешественников и принимающих по всему миру. Обменивайтесь опытом, делитесь историями и создавайте
            незабываемые приключения в безопасности и с доверием.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button aria-label="Открыть форму регистрации" className="w-full sm:w-auto">
              Попробовать сейчас
            </Button>
            <Button aria-label="Узнать больше о Couchsurf.ru" variant="outline" className="w-full sm:w-auto">
              Узнать больше
            </Button>
          </div>
        </div>
        <Card className="h-full justify-between bg-background/80 backdrop-blur" aria-label="Быстрый поиск вариантов проживания">
          <CardHeader>
            <CardTitle>Попробуйте демо поиска</CardTitle>
            <CardDescription>Наши элементы интерфейса работают одинаково в светлой и тёмной темах.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <label className="space-y-2" htmlFor="city">
              <span className="text-sm font-medium text-muted-foreground">Куда отправимся?</span>
              <Input id="city" name="city" placeholder="Например, Казань" aria-describedby="city-hint" />
            </label>
            <p id="city-hint" className="text-xs text-muted-foreground">
              Подбор подскажет проверенных хостов поблизости.
            </p>
          </CardContent>
          <CardFooter className="justify-end">
            <Button aria-label="Найти варианты проживания">Искать</Button>
          </CardFooter>
        </Card>
      </section>

      <section id="features" className="grid gap-8 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="bg-background">
            <CardHeader>
              <CardTitle>
                {item === 1 && 'Профили, которым доверяют'}
                {item === 2 && 'Фильтры под ваш стиль'}
                {item === 3 && 'Общайтесь до встречи'}
              </CardTitle>
              <CardDescription>
                {item === 1 && 'Подробные анкеты с отзывами, верификацией документов и вниманием к безопасности.'}
                {item === 2 && 'Выбирайте жильё по интересам, доступности и хобби хозяев, чтобы совпасть по духу.'}
                {item === 3 && 'Чат и видеоинтро до поездки помогут познакомиться и почувствовать себя увереннее.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {item === 1 &&
                'Каждый участник подтверждает личность и проходит модерацию. Мы подсказываем, как сделать профиль ещё привлекательнее.'}
              {item === 2 &&
                'Гибкая система фильтров и подборок поможет найти идеальное совпадение под ваши даты и образ жизни.'}
              {item === 3 &&
                'Создавайте безопасные контакты с помощью встроенного чата, рекомендаций и полезных подсказок от комьюнити.'}
            </CardContent>
          </Card>
        ))}
      </section>

      <section id="safety" className="rounded-[var(--radius)] bg-primary text-primary-foreground shadow-soft-lg">
        <div className="grid gap-6 p-10 md:grid-cols-[1.2fr,0.8fr] md:items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold leading-tight">Безопасность в основе</h2>
            <p className="text-base opacity-90">
              Рекомендации сообщества, круглосуточная поддержка и встроенные проверки позволяют чувствовать себя уверенно на каждом этапе пути.
            </p>
          </div>
          <Card className="bg-background/90 text-foreground">
            <CardHeader>
              <CardTitle>Мягкие тени и большие скругления</CardTitle>
              <CardDescription>
                Тема Couchsurf.ru сочетает глубокий тёплый бирюзовый с песочными акцентами, создавая ощущения спокойствия и заботы.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Переключатель темы сохранит ваш выбор и адаптирует интерфейс под предпочтения устройства.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
