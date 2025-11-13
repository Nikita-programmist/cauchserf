import { NextResponse } from 'next/server';

import { listRoomsForUser } from '@/lib/chatService';
import { getRouteHandlerSupabase } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getRouteHandlerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.warn('[GET /api/rooms] unauthorized access attempt', error);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const rooms = await listRoomsForUser(supabase, user.id);
    return NextResponse.json({ rooms }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/rooms] failed to load rooms', err);
    return NextResponse.json({ error: 'failed_to_load_rooms' }, { status: 500 });
  }
}
