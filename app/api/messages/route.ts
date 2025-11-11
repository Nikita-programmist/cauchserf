import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { ensureRoomForStayRequest } from '@/lib/chatService';
import { getAdminSupabase } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/supabase/types';

export const runtime = 'nodejs';

function parsePagination(searchParams: URLSearchParams) {
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  const limit = Number.isFinite(Number(limitParam))
    ? Math.max(1, Math.min(200, Number(limitParam)))
    : 50;
  const offset = Number.isFinite(Number(offsetParam))
    ? Math.max(0, Number(offsetParam))
    : 0;

  return { limit, offset };
}

async function getAuthUser() {
  const client = createRouteHandlerClient<Database>({ cookies });

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

async function assertRequestParticipation(
  requestId: string,
  userId: string
) {
  const client = getAdminSupabase();

  const { data, error } = await client
    .from('stay_requests')
    .select('id, traveler_id, host_id, room_id')
    .eq('id', requestId)
    .maybeSingle();

  if (error || !data) {
    return { error: NextResponse.json({ error: 'Access denied' }, { status: 403 }) };
  }

  const participant =
    data.traveler_id === userId || data.host_id === userId;

  if (!participant) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { request: data };
}

type StayRequestIdentifiers = Pick<
  Database['public']['Tables']['stay_requests']['Row'],
  'id' | 'traveler_id' | 'host_id' | 'room_id'
>;

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    const requestId =
      typeof payload?.requestId === 'string' ? payload.requestId : '';
    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    if (!text) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const participation = await assertRequestParticipation(requestId, user.id);
    if ('error' in participation) {
      return participation.error;
    }

    const client = getAdminSupabase();
    const ensured = await ensureRoomForStayRequest(client, participation.request.id);

    if (!ensured) {
      return NextResponse.json({ error: 'request_not_found' }, { status: 404 });
    }

    const { roomId } = ensured;

    const { data, error } = await client
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content: text,
      })
      .select('id, room_id, user_id, content, created_at')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        roomId,
        message: data,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const participation = await assertRequestParticipation(requestId, user.id);
    if ('error' in participation) {
      return participation.error;
    }

    const { limit, offset } = parsePagination(searchParams);
    const client = getAdminSupabase();

    const roomId = participation.request.room_id;

    if (!roomId) {
      return NextResponse.json(
        {
          roomId: null,
          messages: [],
          pagination: { limit, offset, count: 0 },
        },
        { status: 200 }
      );
    }

    const rangeTo = offset + limit - 1;
    const { data, error } = await client
      .from('messages')
      .select('id, room_id, user_id, content, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .range(offset, rangeTo);

    if (error) {
      return NextResponse.json(
        { error: error.message ?? 'Failed to load messages' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        roomId,
        messages: data ?? [],
        pagination: { limit, offset, count: data?.length ?? 0 },
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

