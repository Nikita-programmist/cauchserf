import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "../lib/brand";

const title = `${BRAND.name} — ${BRAND.tagline}`;
const description =
  "Сообщество соседей, готовых поделиться диваном, завтраком и историями. Планируйте маршруты и находите ночлег среди единомышленников.";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-accent via-accent to-white text-slate-900">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
      </Head>

      <header className="border-b border-primary/20 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 text-primary">
            <Image src="/logo.svg" alt={BRAND.name} width={120} height={32} priority />
            <span className="sr-only">{BRAND.name}</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#community" className="hover:text-primary">
              Сообщество
            </a>
            <a href="#how" className="hover:text-primary">
              Как это работает
            </a>
            <a href="#cta" className="rounded-full bg-primary px-4 py-2 text-white shadow-sm hover:bg-primary/90">
              Присоединиться
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-20 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-sm font-medium text-primary shadow-sm">
                {BRAND.name}
              </span>
              <h1 className="font-display text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                {BRAND.tagline}
              </h1>
              <p className="text-lg text-slate-700">
                {description}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  id="cta"
                  href="#community"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  Найти ночлег
                </a>
                <a
                  href="#hosts"
                  className="inline-flex items-center justify-center rounded-full border border-primary/40 bg-white px-6 py-3 text-base font-semibold text-primary transition hover:border-primary/60 hover:bg-primary/5"
                >
                  Стать хостом
                </a>
              </div>
            </div>
            <div className="flex-1">
              <div className="rounded-3xl border border-primary/20 bg-white/80 p-6 shadow-xl shadow-primary/10">
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                  <div className="rounded-2xl bg-accent/80 p-4">
                    <p className="text-xs uppercase text-slate-500">Города</p>
                    <p className="mt-2 text-2xl font-semibold text-primary">120+</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">Хосты</p>
                    <p className="mt-2 text-2xl font-semibold text-primary">6 800</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase text-slate-500">Отклики</p>
                    <p className="mt-2 text-2xl font-semibold text-primary">45 мин</p>
                  </div>
                  <div className="rounded-2xl bg-accent/80 p-4">
                    <p className="text-xs uppercase text-slate-500">Встречи</p>
                    <p className="mt-2 text-2xl font-semibold text-primary">12 400</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="community" className="border-y border-primary/10 bg-white/80">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="font-display text-3xl font-semibold text-slate-900">Сообщество соседей</h2>
              <p className="mt-4 text-slate-700">
                Мы объединяем тех, кто любит открывать новые города через знакомства с местными. {BRAND.name} помогает найти жильё и новых друзей.
              </p>
            </div>
            <div className="grid gap-6 lg:col-span-2">
              <article className="rounded-3xl border border-primary/20 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-primary">Проверенные профили</h3>
                <p className="mt-2 text-slate-700">
                  Каждый участник проходит модерацию, чтобы в путешествии вы чувствовали себя так же спокойно, как дома.
                </p>
              </article>
              <article className="rounded-3xl border border-primary/20 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-primary">Истории из первых рук</h3>
                <p className="mt-2 text-slate-700">
                  Делитесь рекомендациями, маршрутами и лучшими кафе прямо в приложении, знакомьтесь с городом глазами местных.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="how" className="bg-white/60">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-center font-display text-3xl font-semibold text-slate-900">
              Как работает {BRAND.name}
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Создайте профиль и расскажите о себе",
                "Найдите соседа в нужном городе",
                "Договоритесь о датах и условиях проживания",
                "Оставьте отзыв и оставайтесь на связи"
              ].map((step, index) => (
                <div key={step} className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                    {index + 1}
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-primary/10 bg-white/80">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-600 sm:flex-row">
          <div className="flex items-center gap-2 text-primary">
            <Image src="/logo.svg" alt={BRAND.name} width={100} height={28} />
            <span>{BRAND.tagline}</span>
          </div>
          <p>© {new Date().getFullYear()} {BRAND.name}. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
