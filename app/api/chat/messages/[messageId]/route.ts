import { NextResponse } from 'next/server';
import { getCurrentUser, getServiceSupabase } from '@/lib/supabaseServer';

export async function PATCH(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from('messages')
    .select('id, sender_id')
    .eq('id', params.messageId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing || existing.sender_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
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
    .select('id, sender_id, text, created_at, edited_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from('messages')
    .select('id, sender_id')
    .eq('id', params.messageId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing || existing.sender_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', params.messageId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
