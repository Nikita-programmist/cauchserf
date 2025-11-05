import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ensureChatRoom } from '@/lib/chatRooms';
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get('otherUserId');

  if (!otherUserId) {
    return NextResponse.json(
      { error: 'Missing otherUserId parameter' },
      { status: 400 }
    );
  }

  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.id === otherUserId) {
    return NextResponse.json(
      { error: 'Cannot create chat with yourself' },
      { status: 400 }
    );
  }

  const client = admin();

  const { data: existingRoom, error: existingError } = await client
    .from('chat_rooms')
    .select('id, traveler_id, host_id, created_at')
    .or(
      `and(traveler_id.eq.${user.id},host_id.eq.${otherUserId}),and(traveler_id.eq.${otherUserId},host_id.eq.${user.id})`
    )
    .maybeSingle<{ id: string | null }>();

  if (existingError) {
    return NextResponse.json(
      { error: existingError.message },
      { status: 500 }
    );
  }

  if (existingRoom?.id) {
    return NextResponse.json({ roomId: existingRoom.id });
  }

  const { data: requestRow, error: requestError } = await client
    .from('stay_requests')
    .select('traveler_id, host_id, created_at')
    .or(
      `and(traveler_id.eq.${user.id},host_id.eq.${otherUserId}),and(traveler_id.eq.${otherUserId},host_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<{ traveler_id: string | null; host_id: string | null }>();

  if (requestError) {
    return NextResponse.json(
      { error: requestError.message },
      { status: 500 }
    );
  }

  if (!requestRow) {
    return NextResponse.json(
      { error: 'No stay request found between users' },
      { status: 404 }
    );
  }

  const participant =
    requestRow.traveler_id === user.id || requestRow.host_id === user.id;

  if (!participant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const room = await ensureChatRoom(
    requestRow.traveler_id as string,
    requestRow.host_id as string
  );

  return NextResponse.json({ roomId: room.id });
}
