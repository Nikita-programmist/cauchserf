import { Html, Head, Main, NextScript } from 'next/document';

const themeScript = `(() => {
  try {
    const stored = window.localStorage.getItem('domik-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();`;

export default function Document() {
  return (
    <Html lang="ru" data-theme="light">
      <Head />
      <body>
        <Main />
        <NextScript />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </body>
    </Html>
  );
}
