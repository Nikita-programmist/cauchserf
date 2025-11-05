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

async function loadMessage(messageId: string) {
  const client = admin();

  const { data: message, error } = await client
    .from('messages')
    .select('id, conversation_id, sender_id, text, created_at, edited_at, deleted_at')
    .eq('id', messageId)
    .maybeSingle();

  if (error || !message) {
    return { error: NextResponse.json({ error: 'Message not found' }, { status: 404 }) };
  }

  const { data: request, error: requestError } = await client
    .from('stay_requests')
    .select('id, traveler_id, host_id')
    .eq('conversation_id', message.conversation_id)
    .maybeSingle();

  if (requestError || !request) {
    return {
      error: NextResponse.json({ error: 'Access denied' }, { status: 403 }),
    };
  }

  return { message, request };
}

export async function PATCH(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

  if (!text) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  }

  const context = await loadMessage(params.messageId);
  if ('error' in context) {
    return context.error;
  }

  const { message, request } = context;

  const participant =
    request.traveler_id === user.id || request.host_id === user.id;
  if (!participant || message.sender_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = admin();

  const { data, error } = await client
    .from('messages')
    .update({ text, edited_at: new Date().toISOString() })
    .eq('id', params.messageId)
    .select('id, conversation_id, sender_id, text, created_at, edited_at, deleted_at')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update message' },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: data }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { messageId: string } }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const context = await loadMessage(params.messageId);
  if ('error' in context) {
    return context.error;
  }

  const { message, request } = context;

  const participant =
    request.traveler_id === user.id || request.host_id === user.id;
  if (!participant || message.sender_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = admin();

  const { error } = await client
    .from('messages')
    .delete()
    .eq('id', params.messageId);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to delete message' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

