import Head from 'next/head';
import Link from 'next/link';

export default function HostSetupPage() {
  return (
    <>
      <Head>
        <title>Настройка хоста — Домик</title>
      </Head>
      <main className="mx-auto mt-20 flex w-full max-w-2xl flex-col gap-6 px-6 text-center">
        <div className="glass flex flex-col gap-4 px-8 py-10">
          <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Шаги для хоста</p>
          <h1 className="text-2xl font-semibold text-fg">Скоро добавим объявления</h1>
          <p className="text-sm text-fg/70">
            Вы выбрали роль хоста. Здесь появится мастер создания объявления, а пока вы можете вернуться к профилю или ленте.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link className="btn-ghost" href="/profile">
              Перейти в профиль
            </Link>
            <Link className="btn-solid" href="/feed">
              Открыть ленту
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
