import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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
  const { user, supabase, hasSupabaseEnv } = useAuth();
  const [profileRole, setProfileRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!supabase || !user) {
      setProfileRole(null);
      return;
    }

    let active = true;

    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setProfileRole(data?.role ?? null);
      });

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
  };

  const roleLabel = profileRole === 'host' ? 'Хозяин' : profileRole === 'guest' ? 'Гость' : null;

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
          {!user || !hasSupabaseEnv ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/signin">Вход</Link>
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
                  <Link href="/profile" className="rounded-md px-2 py-1 hover:bg-white/10">
                    Профиль
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
            {!user || !hasSupabaseEnv ? (
              <>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/signin">Вход</Link>
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
