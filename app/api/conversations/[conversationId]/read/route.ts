
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { markConversationRead } from '@/lib/chatService';
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

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const res = await markConversationRead(params.conversationId, user.id);
    return NextResponse.json(res);
  } catch (err: any) {
    if (err.message === 'forbidden') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
