import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Создаём серверный клиент Supabase, который знает куки
function getServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          cookieStore.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
}

// GET /api/conversations
export async function GET() {
  try {
    const supabase = getServerSupabase();

    // 1. Узнаём кто залогинен
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // фронт поймёт что чата нет, но главное — не падаем в 502
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    // 2. Тянем разговоры, в которых этот user участвует.
    // ВАЖНО: мы не знаем на 100% как ты назвал таблицы.
    // Я предполагаю, что у тебя есть таблица conversations
    // с колонками traveler_id и host_id.
    //
    // Даже если тут будет ошибка в запросе — она улетит в catch,
    // а мы вернём [] вместо 502.
    const { data: convRows, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        traveler_id,
        host_id,
        traveler:profiles!conversations_traveler_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        host:profiles!conversations_host_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .or(`traveler_id.eq.${user.id},host_id.eq.${user.id}`);

    if (convError) {
      console.error('conversations query error:', convError);
      // Возвращаем пустой список, чтоб фронт не упал.
      return NextResponse.json([], { status: 200 });
    }

    // 3. Приводим данные в формат, который ждёт фронт (см. твой ChatPageClient)
    // Ему нужен массив [{ conversationId: '...', otherUser: {...}, ... }]
    const result = (convRows || []).map((row: any) => {
      const iAmTraveler = row.traveler_id === user.id;
      const other = iAmTraveler ? row.host : row.traveler;

      return {
        conversationId: row.id,
        otherUser: {
          id: other?.id ?? null,
          name: other?.full_name ?? 'Без имени',
          avatarUrl: other?.avatar_url ?? null,
        },
      };
    });

    // Готово
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    // Вот это самое главное: не даём умереть функции → значит не будет 502
    console.error('GET /api/conversations crashed:', err);
    return NextResponse.json([], { status: 200 });
  }
}

// Говорим Next.js не кешировать это навечно
export const dynamic = 'force-dynamic';
