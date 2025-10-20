import { useRouter } from 'next/router';
import { useState } from 'react';
import { Button } from './ui/button';
import { Popover } from './ui/popover';

const links = [
  { label: 'Гиды', href: '#guides' },
  { label: 'Отзывы', href: '#stories' },
  { label: 'Контакты', href: '#contact' }
];

export function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

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
        <div className="hidden gap-3 md:flex">
          <Button variant="ghost">Вход</Button>
          <Button variant="solid" type="button" onClick={() => router.push('/onboarding/role')}>
            Зарегистрироваться
          </Button>
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
          <a href="#safety" className="rounded-lg px-3 py-2 hover:bg-white/10">
            Безопасность
          </a>
          <a href="#faq" className="rounded-lg px-3 py-2 hover:bg-white/10">
            FAQ
          </a>
          <a href="#team" className="rounded-lg px-3 py-2 hover:bg-white/10">
            Команда
          </a>
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="ghost" className="w-full">
              Вход
            </Button>
            <Button
              variant="solid"
              className="w-full"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push('/onboarding/role');
              }}
            >
              Зарегистрироваться
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
