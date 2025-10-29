import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { ensureChatRoom, getCurrentUserProfile } from '@/lib/chatRooms';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get('otherUserId');

  if (!otherUserId) {
    return NextResponse.json(
      { error: 'Missing otherUserId parameter' },
      { status: 400 }
    );
  }

  const currentProfile = await getCurrentUserProfile();

  if (!currentProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (currentProfile.id === otherUserId) {
    return NextResponse.json(
      { error: 'Cannot create chat with yourself' },
      { status: 400 }
    );
  }

  const supabase = getServerSupabase();

  const { data: existingRoom, error: existingError } = await supabase
    .from('chat_rooms')
    .select('id, traveler_id, host_id, created_at')
    .or(
      `and(traveler_id.eq.${currentProfile.id},host_id.eq.${otherUserId}),and(traveler_id.eq.${otherUserId},host_id.eq.${currentProfile.id})`
    )
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: existingError.message },
      { status: 500 }
    );
  }

  if (existingRoom) {
    return NextResponse.json({ roomId: existingRoom.id });
  }

  const { data: requestRow, error: requestError } = await supabase
    .from('stay_requests')
    .select('traveler_id, host_id, created_at')
    .or(
      `and(traveler_id.eq.${currentProfile.id},host_id.eq.${otherUserId}),and(traveler_id.eq.${otherUserId},host_id.eq.${currentProfile.id})`
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

  const room = await ensureChatRoom(
    requestRow.traveler_id as string,
    requestRow.host_id as string
  );

  return NextResponse.json({ roomId: room.id });
}
