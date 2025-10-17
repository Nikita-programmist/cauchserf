import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from './ui/button';

const storageKey = 'couchsurf-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = window.localStorage.getItem(storageKey);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeToggle() {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    window.localStorage.setItem(storageKey, theme);
  }, [mounted, theme]);

  const handleToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Button
      aria-label={`Переключить тему. Текущая тема: ${theme === 'light' ? 'светлая' : 'тёмная'}`}
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="rounded-full border border-transparent transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:ring-offset-foreground"
    >
      {mounted && theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </Button>
  );
}
