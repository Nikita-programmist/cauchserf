import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { admin } from '@/lib/supabase/server';
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
  const client = admin();

  const { data, error } = await client
    .from('stay_requests')
    .select('id, traveler_id, host_id, conversation_id')
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
  'id' | 'traveler_id' | 'host_id' | 'conversation_id'
>;

async function ensureConversationId(request: StayRequestIdentifiers) {
  const client = admin();
  if (request.conversation_id) {
    return request.conversation_id;
  }

  const { data: created, error } = await client
    .from('conversations')
    .insert({
      traveler_id: request.traveler_id,
      host_id: request.host_id,
    })
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? 'Unable to create conversation');
  }

  const conversationId = created.id;

  await client
    .from('stay_requests')
    .update({ conversation_id: conversationId })
    .eq('id', request.id);

  await client
    .from('conversation_bookings')
    .upsert(
      { booking_id: request.id, conversation_id: conversationId },
      { onConflict: 'booking_id' }
    );

  return conversationId;
}

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

    const conversationId = await ensureConversationId(participation.request);
    const client = admin();

    const { data, error } = await client
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        text,
      })
      .select('id, conversation_id, sender_id, text, created_at, edited_at, deleted_at')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        conversationId,
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
    const client = admin();

    const conversationId = participation.request.conversation_id;

    if (!conversationId) {
      return NextResponse.json(
        {
          conversationId: null,
          messages: [],
          pagination: { limit, offset, count: 0 },
        },
        { status: 200 }
      );
    }

    const rangeTo = offset + limit - 1;
    const { data, error } = await client
      .from('messages')
      .select('id, conversation_id, sender_id, text, created_at, edited_at, deleted_at')
      .eq('conversation_id', conversationId)
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
        conversationId,
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

