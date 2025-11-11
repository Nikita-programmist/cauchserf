import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { admin } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export const runtime = 'nodejs';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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

async function requireConversationParticipant(
  conversationId: string,
  userId: string
) {
  const client = admin();

  const { data, error } = await client
    .from('conversations')
    .select('id, traveler_id, host_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    console.error(
      '[api/conversations/[id]/messages] failed to load conversation',
      error
    );
    return {
      error: NextResponse.json({ error: 'server_error' }, { status: 500 }),
    };
  }

  if (!data) {
    return {
      error: NextResponse.json({ error: 'not_found' }, { status: 404 }),
    };
  }

  const participant =
    data.traveler_id === userId || data.host_id === userId;

  if (!participant) {
    return {
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    };
  }

  return { conversation: data };
}

function parseLimit(raw: string | null) {
  const value = Number(raw);
  if (Number.isFinite(value)) {
    return Math.min(Math.max(1, Math.trunc(value)), MAX_LIMIT);
  }
  return DEFAULT_LIMIT;
}

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const conversationId = params.conversationId;
  if (!conversationId) {
    return NextResponse.json({ error: 'conversation_id_missing' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseLimit(searchParams.get('limit'));
  const cursor = searchParams.get('cursor');

  const participation = await requireConversationParticipant(
    conversationId,
    user.id
  );
  if ('error' in participation) {
    return participation.error;
  }

  const client = admin();

  const fetchLimit = limit + 1;
  let query = client
    .from('messages')
    .select('id, conversation_id, sender_id, text, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(fetchLimit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      '[api/conversations/[id]/messages] failed to load messages',
      error
    );
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.created_at ?? null : null;

  return NextResponse.json({ items, nextCursor }, { status: 200 });
}
