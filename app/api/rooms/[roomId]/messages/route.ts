import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getAuthUser() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null } as const;
  }

  return { supabase, user } as const;
}

async function ensureMembership(supabase: any, roomId: string, userId: string) {
  const { data, error } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[rooms.messages] membership check failed', error);
    throw new Error('membership_check_failed');
  }

  return Boolean(data);
}

function parseLimit(searchParams: URLSearchParams) {
  const raw = Number(searchParams.get('limit'));
  if (!Number.isFinite(raw)) {
    return 50;
  }
  return Math.min(200, Math.max(1, Math.trunc(raw)));
}

export async function GET(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const roomId = params.roomId;
  if (!roomId) {
    return NextResponse.json({ error: 'roomId_required' }, { status: 400 });
  }

  const { supabase, user } = await getAuthUser();
  if (!user) {
    console.warn(`[GET /api/rooms/${roomId}/messages] unauthorized request`);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const isMember = await ensureMembership(supabase, roomId, user.id);
    if (!isMember) {
      console.warn(`[GET /api/rooms/${roomId}/messages] forbidden for user ${user.id}`);
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseLimit(searchParams);

    const { data, error } = await supabase
      .from('messages')
      .select('id, room_id, user_id, content, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error(`[GET /api/rooms/${roomId}/messages] failed to load messages`, error);
      return NextResponse.json({ error: 'failed_to_load_messages' }, { status: 500 });
    }

    const items = data ?? [];
    return NextResponse.json({ room_id: roomId, messages: items, items }, { status: 200 });
  } catch (err) {
    console.error(`[GET /api/rooms/${roomId}/messages] unexpected error`, err);
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const roomId = params.roomId;
  if (!roomId) {
    return NextResponse.json({ error: 'roomId_required' }, { status: 400 });
  }

  const { supabase, user } = await getAuthUser();
  if (!user) {
    console.warn(`[POST /api/rooms/${roomId}/messages] unauthorized request`);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const content =
    typeof payload?.content === 'string'
      ? payload.content.trim()
      : typeof payload?.text === 'string'
      ? payload.text.trim()
      : '';

  if (!content) {
    return NextResponse.json({ error: 'content_required' }, { status: 400 });
  }

  try {
    const isMember = await ensureMembership(supabase, roomId, user.id);
    if (!isMember) {
      console.warn(`[POST /api/rooms/${roomId}/messages] forbidden for user ${user.id}`);
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content,
      })
      .select('id, room_id, user_id, content, created_at')
      .single();

    if (error || !data) {
      console.error(`[POST /api/rooms/${roomId}/messages] failed to insert message`, error);
      return NextResponse.json({ error: 'failed_to_send_message' }, { status: 500 });
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (err) {
    console.error(`[POST /api/rooms/${roomId}/messages] unexpected error`, err);
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
