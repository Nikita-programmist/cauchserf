import '../styles/globals.css';

import { ReactNode } from 'react';

import Providers from './providers';
import ThemeInitializer from './theme-initializer';

export const metadata = {
  title: 'Домик',
  description: 'Сообщество путешественников и хозяев Домика'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-background text-fg">
        <ThemeInitializer />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
