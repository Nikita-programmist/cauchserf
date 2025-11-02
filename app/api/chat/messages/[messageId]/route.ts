import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export async function PATCH(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const content = typeof body?.content === 'string' ? body.content.trim() : '';

  if (!content) {
    return NextResponse.json({ error: 'empty' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('messages')
    .update({ text: content, edited_at: new Date().toISOString() })
    .eq('id', params.messageId)
    .eq('sender_id', user.id)
    .select('id, sender_id, text, created_at, edited_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: {
      id: data.id,
      content: data.text,
      sender_id: data.sender_id,
      created_at: data.created_at,
      edited_at: data.edited_at ?? null,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { messageId: string } }
) {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', params.messageId)
    .eq('sender_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
