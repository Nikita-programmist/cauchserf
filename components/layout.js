import Head from 'next/head';
import Link from 'next/link';

import { ThemeToggle } from './theme-toggle';

export function Layout({ children, title = 'Couchsurf.ru' }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Head>
        <title>{title}</title>
        <meta name="theme-color" content="#0f4c5c" />
      </Head>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Перейти на главную Couchsurf.ru"
              className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-lg font-semibold text-primary shadow-soft transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">CS</span>
              Couchsurf.ru
            </Link>
            <nav aria-label="Основная навигация сайта" className="hidden items-center gap-2 text-sm font-medium sm:flex">
              <Link
                href="#features"
                className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Возможности
              </Link>
              <Link
                href="#safety"
                className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Безопасность
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/auth"
              className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Войти
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-12">
          {children}
        </div>
      </main>
      <footer className="border-t border-border/60 bg-background/80">
        <div className="container flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Couchsurf.ru. Сделано с заботой о путешественниках.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="mailto:hello@couchsurf.ru"
              className="rounded-full px-3 py-2 transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Написать нам
            </Link>
            <Link
              href="/privacy"
              className="rounded-full px-3 py-2 transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
