import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.has('roomId')) {
    return NextResponse.json(
      { error: 'roomId parameter is not supported' },
      { status: 400 }
    );
  }

  const conversationId = searchParams.get('conversationId');

  if (!conversationId || conversationId.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing conversationId' },
      { status: 400 }
    );
  }

  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, text, created_at, read_at, edited_at, deleted_at')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    messages: (data ?? []).map((row) => ({
      id: row.id,
      content: row.text,
      sender_id: row.sender_id,
      created_at: row.created_at,
      edited_at: row.edited_at ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const conversationId = body?.conversationId as string | undefined;
  const content = body?.content as string | undefined;

  if (!conversationId || typeof conversationId !== 'string') {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const clean = content.trim();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      text: clean,
    })
    .select('id, sender_id, text, created_at, read_at, edited_at')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (!inserted) {
    return NextResponse.json({ error: 'failed_to_insert' }, { status: 500 });
  }

  return NextResponse.json({
    message: {
      id: inserted.id,
      content: inserted.text,
      sender_id: inserted.sender_id,
      created_at: inserted.created_at,
      edited_at: inserted.edited_at ?? null,
    },
  });
}
