import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function PATCH(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const textInput = typeof payload?.body === 'string' ? payload.body.trim() : '';

  if (!textInput) {
    return NextResponse.json({ error: 'empty' }, { status: 400 });
  }

  const { data: msg, error: msgErr } = await supabase
    .from('chat_messages')
    .select('id, sender_id')
    .eq('id', params.messageId)
    .maybeSingle();

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  if (!msg || msg.sender_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data: updated, error: updErr } = await supabase
    .from('chat_messages')
    .update({
      body: textInput,
      edited_at: new Date().toISOString(),
      deleted_at: null,
    })
    .eq('id', params.messageId)
    .select()
    .maybeSingle();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { messageId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: msg, error: msgErr } = await supabase
    .from('chat_messages')
    .select('id, sender_id')
    .eq('id', params.messageId)
    .maybeSingle();

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  if (!msg || msg.sender_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data: updated, error: updErr } = await supabase
    .from('chat_messages')
    .update({
      body: 'Сообщение удалено',
      deleted_at: new Date().toISOString(),
    })
    .eq('id', params.messageId)
    .select()
    .maybeSingle();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
