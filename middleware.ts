
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Эта прослойка делает так, чтобы supabase-сессия
// (куки с токеном) была доступна и страницам, и API-роутам.
export async function middleware(req: NextRequest) {
  // Ответ по умолчанию — продолжаем запрос
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Создаём Supabase клиент, который умеет автообновлять токен,
  // и записывает свежие куки обратно в ответ.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Триггерим auth.getUser(), чтобы supabase при необходимости
  // обновил токен и записал новую куку в res.
  await supabase.auth.getUser();

  return res;
}

// На какие пути вешаем этот middleware
export const config = {
  matcher: [
    // Всё что не статика
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
