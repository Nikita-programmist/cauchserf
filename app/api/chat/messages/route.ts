import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getServerSupabase } from '@/lib/supabaseServer';
import { sendMessage } from '@/lib/chatService';

async function getMessagesForConversation(
  conversationId: string,
  _userId: string
) {
  const { data } = await getServerSupabase()
    .from('chat_messages')
    .select(
      'id, sender_id, content, text, body, created_at, edited_at, deleted_at'
    )
    .eq('room_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  return data ?? [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const conversationId = searchParams.get('conversationId');

  if (!conversationId || conversationId.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing conversationId' },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const messages = await getMessagesForConversation(
      conversationId,
      user.id
    );

    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawConversationId =
    (typeof body?.conversationId === 'string' && body.conversationId) || '';

  const conversationId = rawConversationId.trim();

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversationId is required' },
      { status: 400 }
    );
  }

  const rawContent =
    (typeof body?.content === 'string' && body.content) ||
    (typeof body?.text === 'string' && body.text) ||
    '';

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const inserted = await sendMessage(conversationId, user.id, rawContent);

    return NextResponse.json({
      message: {
        id: inserted.id,
        content: inserted.text,
        sender_id: inserted.senderId,
        created_at: inserted.createdAt,
        edited_at: inserted.editedAt ?? null,
      },
    });
  } catch (err: any) {
    if (err?.message === 'forbidden') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    if (err?.message === 'empty') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
