import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedRoomId = url.searchParams.get('roomId');

  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, rooms: 0 }, { status: 200 });
  }

  try {
    const { count: roomCount, error: roomCountError } = await supabase
      .from('room_members')
      .select('room_id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (roomCountError) {
      console.error('[GET /api/health/chat] failed to count rooms', roomCountError);
      return NextResponse.json({ ok: false, error: 'failed_to_count_rooms' }, { status: 500 });
    }

    let messagesCountForRoom: number | undefined;

    if (requestedRoomId) {
      const { data: membership, error: membershipError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('room_id', requestedRoomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipError) {
        console.error('[GET /api/health/chat] membership check failed', membershipError);
      } else if (membership) {
        const { count, error: messageCountError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('room_id', requestedRoomId);

        if (messageCountError) {
          console.error('[GET /api/health/chat] failed to count messages', messageCountError);
        } else {
          messagesCountForRoom = count ?? 0;
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        rooms: roomCount ?? 0,
        messagesCountForRoom,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/health/chat] unexpected error', err);
    return NextResponse.json({ ok: false, error: 'unexpected_error' }, { status: 500 });
  }
}
