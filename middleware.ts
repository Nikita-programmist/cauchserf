import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Эта прослойка держит сессию Supabase живой между запросами,
// чтобы API-роуты и Realtime знали кто пользователь.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Обновляем куки в входящем запросе
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });

          // Пересоздаём ответ с новым состоянием куков
          response = NextResponse.next({ request });

          // Прокидываем куки наружу (в браузер)
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Принудительно освежаем сессию пользователя,
  // иначе Supabase может думать что юзер не залогинен.
  await supabase.auth.getUser();

  return response;
}

// Где запускать этот middleware
export const config = {
  matcher: [
    // всё, кроме статики и картинок
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
