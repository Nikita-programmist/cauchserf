import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getServerSupabase } from '@/lib/supabaseServer';

async function insertChatMessage(
  conversationId: string,
  userId: string,
  text: string
) {
  const clean = text.trim();
  if (!clean) {
    throw new Error('empty');
  }

  const { error } = await getServerSupabase()
    .from('chat_messages')
    .insert({
      room_id: conversationId,
      sender_id: userId,
      body: clean,
    });

  if (error) {
    if (error.code === '42501') {
      throw new Error('forbidden');
    }

    throw error;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const text = body?.content ?? body?.text ?? '';

  try {
    await insertChatMessage(params.conversationId, user.id, text);
    return NextResponse.json({}, { status: 200 });
  } catch (err: any) {
    if (err.message === 'forbidden') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (err.message === 'empty') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
