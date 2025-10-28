'use client';

import { useEffect } from 'react';

function setDomikTheme() {
  if (typeof window === 'undefined') {
    return;
  }

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = window.localStorage.getItem('domik-theme');
  const theme = saved || (isDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
}

export function ThemeInitializer() {
  useEffect(() => {
    setDomikTheme();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
    };

    media.addEventListener('change', handler);

    return () => {
      media.removeEventListener('change', handler);
    };
  }, []);

  return null;
}

export default ThemeInitializer;
