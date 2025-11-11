import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ensureRoomForStayRequest } from '@/lib/chatService';
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

  const { data: requestRow, error: requestError } = await client
    .from('stay_requests')
    .select('id, traveler_id, host_id, created_at, room_id')
    .or(
      `and(traveler_id.eq.${user.id},host_id.eq.${otherUserId}),and(traveler_id.eq.${otherUserId},host_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

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

  const requestId = typeof requestRow.id === 'string' ? requestRow.id : null;

  if (!requestId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const ensured = await ensureRoomForStayRequest(client, requestId);

  if (!ensured) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ roomId: ensured.roomId });
}
