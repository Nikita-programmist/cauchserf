import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Button } from './ui/button';
import { Popover } from './ui/popover';

import { useAuth } from './AuthProvider';

const links = [
  { label: 'Гиды', href: '#guides' },
  { label: 'Отзывы', href: '#stories' },
  { label: 'Контакты', href: '#contact' }
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  const roleLabel = user?.role === 'HOST' ? 'Хозяин' : user?.role === 'GUEST' ? 'Гость' : null;
  const isHost = user?.role === 'HOST';

  return (
    <header className="sticky top-4 z-40">
      <nav className="glass mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <a href="#" className="text-lg font-semibold text-fg">
          Домик
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-fg/80 hover:text-fg">
              {link.label}
            </a>
          ))}
          {isHost ? (
            <Link href="/requests" className="text-sm text-fg/80 hover:text-fg">
              Заявки
            </Link>
          ) : null}
          <Popover triggerLabel="Больше">
            <div className="flex flex-col gap-2 text-sm text-fg/90">
              <a href="#safety" className="rounded-md px-2 py-1 hover:bg-white/10">
                Безопасность
              </a>
              <a href="#faq" className="rounded-md px-2 py-1 hover:bg-white/10">
                FAQ
              </a>
              <a href="#team" className="rounded-md px-2 py-1 hover:bg-white/10">
                Команда
              </a>
            </div>
          </Popover>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="glass" asChild>
            <Link href="/search">Найти жильё</Link>
          </Button>
          {isHost ? (
            <>
              <Button variant="glass" asChild>
                <Link href="/host/listings/new">Сдать жильё</Link>
              </Button>
              <Button variant="glass" asChild>
                <Link href="/host/listings">Мои объявления</Link>
              </Button>
            </>
          ) : null}
        </div>
        <div className="hidden gap-3 md:flex">
          {!user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Вход</Link>
              </Button>
              <Button variant="solid" asChild>
                <Link href="/signup">Зарегистрироваться</Link>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {roleLabel ? (
                <span className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-fg/80">
                  {roleLabel}
                </span>
              ) : null}
              <Popover triggerLabel="Аккаунт">
                <div className="flex flex-col gap-2 text-sm text-fg/90">
                  {isHost ? (
                    <Link href="/requests" className="rounded-md px-2 py-1 hover:bg-white/10">
                      Заявки
                    </Link>
                  ) : null}
                  <Link href="/profile" className="rounded-md px-2 py-1 hover:bg-white/10">
                    Профиль
                  </Link>
                  <Link href="/search" className="rounded-md px-2 py-1 hover:bg-white/10">
                    Поиск
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="rounded-md px-2 py-1 text-left hover:bg-white/10"
                  >
                    Выйти
                  </button>
                </div>
              </Popover>
            </div>
          )}
        </div>
        <div className="md:hidden">
          <Button variant="glass" aria-expanded={menuOpen} onClick={() => setMenuOpen((prev) => !prev)}>
            Меню
          </Button>
        </div>
      </nav>
      {menuOpen ? (
        <div className="glass mx-4 mt-2 flex flex-col gap-2 p-4 text-sm text-fg md:hidden">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="rounded-lg px-3 py-2 hover:bg-white/10">
              {link.label}
            </a>
          ))}
          {isHost ? (
            <Link href="/requests" className="rounded-lg px-3 py-2 hover:bg-white/10">
              Заявки
            </Link>
          ) : null}
          <a href="#safety" className="rounded-lg px-3 py-2 hover:bg-white/10">
            Безопасность
          </a>
          <a href="#faq" className="rounded-lg px-3 py-2 hover:bg-white/10">
            FAQ
          </a>
          <a href="#team" className="rounded-lg px-3 py-2 hover:bg-white/10">
            Команда
          </a>
          <Link href="/search" className="rounded-lg px-3 py-2 font-medium text-fg hover:bg-white/10">
            Найти жильё
          </Link>
          {isHost ? (
            <>
              <Link href="/host/listings/new" className="rounded-lg px-3 py-2 font-medium text-fg hover:bg-white/10">
                Сдать жильё
              </Link>
              <Link href="/host/listings" className="rounded-lg px-3 py-2 font-medium text-fg hover:bg-white/10">
                Мои объявления
              </Link>
            </>
          ) : null}
          <div className="mt-3 flex flex-col gap-2">
            {!user ? (
              <>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/login">Вход</Link>
                </Button>
                <Button variant="solid" className="w-full" asChild>
                  <Link href="/signup">Зарегистрироваться</Link>
                </Button>
              </>
            ) : (
              <>
                {roleLabel ? (
                  <div className="rounded-full border border-white/30 px-3 py-1 text-center text-xs uppercase tracking-wide text-fg/80">
                    {roleLabel}
                  </div>
                ) : null}
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/profile">Профиль</Link>
                </Button>
                {isHost ? (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/requests">Заявки</Link>
                  </Button>
                ) : null}
                <Button variant="glass" className="w-full" asChild>
                  <Link href="/search">Найти жильё</Link>
                </Button>
                {isHost ? (
                  <>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/host/listings/new">Сдать жильё</Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/host/listings">Мои объявления</Link>
                    </Button>
                  </>
                ) : null}
                <Button variant="solid" className="w-full" onClick={handleSignOut}>
                  Выйти
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
