import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { getCurrentUserProfile } from '@/lib/chatRooms';

const DEFAULT_LIMIT = 50;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(Number(limitParam) || DEFAULT_LIMIT, 200) : DEFAULT_LIMIT;

  if (!roomId) {
    return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
  }

  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('chat_messages')
    .select(
      `id, room_id, sender_id, body, created_at, read_at,
      sender:profiles!chat_messages_sender_id_fkey(id, display_name, avatar_url)`
    )
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const roomId = body?.roomId as string | undefined;
  const text = body?.text as string | undefined;

  if (!roomId || typeof roomId !== 'string') {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const profile = await getCurrentUserProfile();

  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServerSupabase();

  const { data: inserted, error: insertError } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      sender_id: profile.id,
      body: text.trim(),
    })
    .select(
      `id, room_id, sender_id, body, created_at, read_at,
      sender:profiles!chat_messages_sender_id_fkey(id, display_name, avatar_url)`
    )
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ message: inserted });
}
