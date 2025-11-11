import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { listRoomsForUser } from '@/lib/chatService';
import type { Database } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.warn('[GET /api/rooms] unauthorized access attempt', error);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const rooms = await listRoomsForUser(supabase as any, user.id);
    return NextResponse.json({ rooms }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/rooms] failed to load rooms', err);
    return NextResponse.json({ error: 'failed_to_load_rooms' }, { status: 500 });
  }
}
