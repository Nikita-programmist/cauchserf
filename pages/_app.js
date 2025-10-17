import '../styles/globals.css';
import { useEffect } from 'react';

function setDomikTheme() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = window.localStorage.getItem('domik-theme');
  const theme = saved || (isDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
}

export default function App({ Component, pageProps }) {
  useEffect(() => {
    setDomikTheme();
    const handler = (event) => {
      if (!event.matches) {
        document.documentElement.dataset.theme = 'light';
      } else {
        document.documentElement.dataset.theme = 'dark';
      }
    };

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  return <Component {...pageProps} />;
}
