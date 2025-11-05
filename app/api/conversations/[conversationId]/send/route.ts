import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { admin } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export const runtime = 'nodejs';

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

async function assertConversationParticipant(
  conversationId: string,
  userId: string
) {
  const client = admin();

  const { data, error } = await client
    .from('conversations')
    .select('id, traveler_id, host_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (error || !data) {
    return {
      error: NextResponse.json({ error: 'Conversation not found' }, { status: 404 }),
    };
  }

  const participant =
    data.traveler_id === userId || data.host_id === userId;

  if (!participant) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { conversation: data };
}

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversationId = params.conversationId;
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }

  const payload = await req.json().catch(() => null);
  const text = typeof payload?.content === 'string' ? payload.content.trim() : '';

  if (!text) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const participation = await assertConversationParticipant(conversationId, user.id);
  if ('error' in participation) {
    return participation.error;
  }

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

  return NextResponse.json({ message: data }, { status: 200 });
}
